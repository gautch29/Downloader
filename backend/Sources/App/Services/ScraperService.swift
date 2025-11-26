import Vapor
import SwiftSoup
import Fluent

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

    func searchMovies(query: String) async throws -> SearchResult {
        let searchURL = "\(ztBaseURL)/?search=\(query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"
        
        let response = try await client.get(URI(string: searchURL))
        guard let body = response.body else {
            throw Abort(.badGateway, reason: "Empty response from ZT")
        }
        
        let html = String(buffer: body)
        let doc = try SwiftSoup.parse(html)
        
        // Note: This is a simplified scraper based on typical ZT structure. 
        // Real implementation would need precise selectors matching the current ZT theme.
        // Assuming standard DLE (DataLife Engine) structure often used by ZT clones.
        
        let elements = try doc.select(".cover_global")
        var movies: [MovieResult] = []
        
        for element in elements {
            let titleEl = try element.select(".cover_infos_title a")
            let title = try titleEl.text()
            let url = try titleEl.attr("href")
            let img = try element.select("img").attr("src")
            
            // Extract metadata from title or other elements
            let quality = try element.select(".detail_release").text()
            let language = try element.select(".detail_langue").text()
            
            let movie = MovieResult(
                id: url, // Use URL as ID for now
                title: title,
                year: nil, // Extract from title if needed
                quality: quality.isEmpty ? "Unknown" : quality,
                language: language.isEmpty ? "Unknown" : language,
                poster: img.starts(with: "/") ? "\(ztBaseURL)\(img)" : img,
                links: [url] // Detail page URL
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
        
        guard let finalKey = key, !finalKey.isEmpty else {
            throw Abort(.internalServerError, reason: "ONEFICHIER_API_KEY not set in env or DB")
        }

        let cleanUrl = url.components(separatedBy: "&")[0]
        
        let response = try await client.post("https://api.1fichier.com/v1/download/get_token.cgi") { req in
            req.headers.add(name: .authorization, value: "Bearer \(finalKey)")
            try req.content.encode(["url": cleanUrl])
        }
        
        let result = try response.content.decode(OneFichierResponse.self)
        
        if let link = result.url ?? result.link {
            return link
        }
        
        throw Abort(.badRequest, reason: "No download link found: \(result.message ?? "Unknown error")")
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
