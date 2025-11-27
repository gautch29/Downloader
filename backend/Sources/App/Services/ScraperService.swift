import Vapor
import SwiftSoup
import Fluent
import Foundation
import AsyncHTTPClient
import NIOSSL

struct MovieResult: Content {
    var id: String
    var title: String
    var year: String?
    var quality: String?
    var language: String?
    var poster: String?
    var links: [String]
}

struct SearchResult: Content {
    var movies: [MovieResult]
    var total: Int
}

struct OneFichierResponse: Decodable {
    var url: String?
    var link: String?
    var status: String?
    var message: String?
}

actor ScraperService {
    let client: Client
    let apiKey: String?
    let ztBaseURL = "https://zone-telechargement.irish"

    init(client: Client) {
        self.client = client
        self.apiKey = Environment.get("ONEFICHIER_API_KEY")
    }
    
    // Helper to create insecure client
    private func makeInsecureClient() -> HTTPClient {
        var tlsConfig = TLSConfiguration.makeClientConfiguration()
        tlsConfig.certificateVerification = .none
        return HTTPClient(
            eventLoopGroupProvider: .singleton,
            configuration: HTTPClient.Configuration(tlsConfiguration: tlsConfig)
        )
    }

    func searchMovies(query: String) async throws -> SearchResult {
        let searchURL = "\(ztBaseURL)/?search=\(query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"
        
        // Resolve IPv4 to bypass Cloudflare/Protection
        guard let (ipv4UrlString, originalHost) = NetworkUtils.getIPv4URL(from: searchURL),
              let url = URL(string: ipv4UrlString) else {
            throw Abort(.badRequest, reason: "Invalid URL or DNS resolution failed")
        }
        
        let httpClient = makeInsecureClient()
        defer { try? httpClient.syncShutdown() }
        
        var request = try HTTPClient.Request(url: url)
        request.headers.add(name: "Host", value: originalHost)
        request.headers.add(name: "User-Agent", value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        
        let response = try await httpClient.execute(request: request).get()
        
        guard let body = response.body else {
            throw Abort(.badGateway, reason: "Empty response from ZT")
        }
        
        let html = String(buffer: body)
        let doc = try SwiftSoup.parse(html)
        
        let elements = try doc.select(".cover_global")
        var movies: [MovieResult] = []
        
        for element in elements {
            let titleEl = try element.select(".cover_infos_title a")
            let title = try titleEl.text()
            let url = try titleEl.attr("href")
            let img = try element.select("img").attr("src")
            
            let quality = try element.select(".detail_release").text()
            let language = try element.select(".detail_langue").text()
            
            let movie = MovieResult(
                id: url,
                title: title,
                year: nil,
                quality: quality.isEmpty ? "Unknown" : quality,
                language: language.isEmpty ? "Unknown" : language,
                poster: img.starts(with: "/") ? "\(self.ztBaseURL)\(img)" : img,
                links: [url]
            )
            movies.append(movie)
        }
        
        return SearchResult(movies: movies, total: movies.count)
    }

    func getDownloadLink(url: String, on db: Database) async throws -> String {
        // Try env first
        var key = apiKey
        
        // If not in env, try DB
        if key == nil {
            if let settings = try? await Setting.query(on: db).first() {
                key = settings.onefichierApiKey
            }
        }
        
        guard let rawKey = key, !rawKey.isEmpty else {
            throw Abort(.internalServerError, reason: "ONEFICHIER_API_KEY not set in env or DB")
        }
        let finalKey = rawKey.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanUrl = url.components(separatedBy: "&")[0]
        
        let apiUrl = "https://api.1fichier.com/v1/download/get_token.cgi"
        
        // Resolve IPv4
        guard let (ipv4UrlString, originalHost) = NetworkUtils.getIPv4URL(from: apiUrl),
              let targetUrl = URL(string: ipv4UrlString) else {
             throw Abort(.badRequest, reason: "DNS resolution failed for 1fichier API")
        }
        
        let httpClient = makeInsecureClient()
        defer { try? httpClient.syncShutdown() }
        
        var request = try HTTPClient.Request(url: targetUrl, method: .POST)
        request.headers.add(name: "Host", value: originalHost)
        request.headers.add(name: "Content-Type", value: "application/json")
        request.headers.add(name: "Authorization", value: "Bearer \(finalKey)")
        request.headers.add(name: "User-Agent", value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        
        let body = ["url": cleanUrl]
        let jsonData = try JSONEncoder().encode(body)
        request.body = .byteBuffer(ByteBuffer(data: jsonData))
        
        let response = try await httpClient.execute(request: request).get()
        
        guard let responseBody = response.body else {
            throw Abort(.badGateway, reason: "Empty response from 1fichier")
        }
        
        let data = Data(buffer: responseBody)
        
        if response.status == .ok {
            let result = try JSONDecoder().decode(OneFichierResponse.self, from: data)
            if let link = result.url ?? result.link {
                return link
            } else {
                throw Abort(.badRequest, reason: "No download link: \(result.message ?? "Unknown")")
            }
        } else {
             let errorMsg = String(data: data, encoding: .utf8) ?? "Unknown error"
             throw Abort(.badRequest, reason: "1fichier API error: \(errorMsg)")
        }
    }

    func scrapeDetail(url: String) async throws -> [String] {
        // Ensure URL is absolute
        let targetURL = url.starts(with: "http") ? url : "\(ztBaseURL)\(url)"
        
        let response = try await client.get(URI(string: targetURL))
        guard let body = response.body else {
            throw Abort(.badGateway, reason: "Empty response from ZT Detail")
        }
        
        let html = String(buffer: body)
        let doc = try SwiftSoup.parse(html)
        
        // Select all links
        let elements = try doc.select("a")
        var links: [String] = []
        
        for element in elements {
            let href = try element.attr("href")
            // Filter for 1fichier or dl-protect links
            if href.contains("1fichier.com") || href.contains("dl-protect") {
                links.append(href)
            }
        }
        
        return links
    }

    func getEpisodeLinks(url: String) async throws -> [String] {
        // Ensure URL is absolute
        let targetURL = url.starts(with: "http") ? url : "\(ztBaseURL)\(url)"
        
        let response = try await client.get(URI(string: targetURL))
        guard let body = response.body else {
            throw Abort(.badGateway, reason: "Empty response from ZT Series")
        }
        
        let html = String(buffer: body)
        let doc = try SwiftSoup.parse(html)
        
        // Logic to extract episode links. 
        // This depends on ZT structure for series.
        // Assuming similar to movies but maybe multiple links per episode.
        // For now, returning all 1fichier/dl-protect links found.
        
        let elements = try doc.select("a")
        var links: [String] = []
        
        for element in elements {
            let href = try element.attr("href")
            if href.contains("1fichier.com") || href.contains("dl-protect") {
                links.append(href)
            }
        }
        
        return links
    }
}
