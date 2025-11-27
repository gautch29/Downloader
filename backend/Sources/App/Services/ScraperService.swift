import Vapor
import SwiftSoup
import Fluent
import Foundation
import AsyncHTTPClient
import NIOSSL
import NIOHTTP1

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
        
        // Use curl via Process to bypass Cloudflare/Protection and force IPv4
        return try await withCheckedThrowingContinuation { continuation in
            let process = Process()
            process.executableURL = URL(fileURLWithPath: "/usr/bin/curl")
            process.arguments = [
                "-4", // Force IPv4
                "-s",
                "-L",
                "-A", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                searchURL
            ]
            
            print("[DEBUG] Searching movies via curl: \(searchURL)")
            
            let pipe = Pipe()
            process.standardOutput = pipe
            
            do {
                try process.run()
                process.waitUntilExit()
                
                let data = pipe.fileHandleForReading.readDataToEndOfFile()
                let html = String(data: data, encoding: .utf8) ?? ""
                
                if html.isEmpty {
                     continuation.resume(throwing: Abort(.badGateway, reason: "Empty response from ZT"))
                     return
                }
                
                do {
                    let doc = try SwiftSoup.parse(html)
                    let elements = try doc.select(".cover_global")
                    print("[DEBUG] Found \(elements.count) movie elements")
                    
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
                    
                    continuation.resume(returning: SearchResult(movies: movies, total: movies.count))
                } catch {
                    continuation.resume(throwing: error)
                }
            } catch {
                continuation.resume(throwing: error)
            }
        }
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
        
        // Use curl via Process for 1fichier API (Force IPv4)
        return try await withCheckedThrowingContinuation { continuation in
            let process = Process()
            process.executableURL = URL(fileURLWithPath: "/usr/bin/curl")
            process.arguments = [
                "-4", // Force IPv4
                "-s",
                "-X", "POST",
                "https://api.1fichier.com/v1/download/get_token.cgi",
                "-H", "Content-Type: application/json",
                "-H", "Authorization: Bearer \(finalKey)",
                "-d", "{\"url\": \"\(cleanUrl)\"}"
            ]
            
            let pipe = Pipe()
            process.standardOutput = pipe
            let errorPipe = Pipe()
            process.standardError = errorPipe
            
            do {
                try process.run()
                process.waitUntilExit()
                
                let data = pipe.fileHandleForReading.readDataToEndOfFile()
                
                if process.terminationStatus == 0 {
                    do {
                        let result = try JSONDecoder().decode(OneFichierResponse.self, from: data)
                        if let link = result.url ?? result.link {
                            continuation.resume(returning: link)
                        } else {
                            continuation.resume(throwing: Abort(.badRequest, reason: "No download link: \(result.message ?? "Unknown")"))
                        }
                    } catch {
                         print("[DEBUG] Curl Output: \(String(data: data, encoding: .utf8) ?? "nil")")
                         continuation.resume(throwing: error)
                    }
                } else {
                    let errorData = errorPipe.fileHandleForReading.readDataToEndOfFile()
                    let errorMsg = String(data: errorData, encoding: .utf8) ?? "Unknown curl error"
                    continuation.resume(throwing: Abort(.internalServerError, reason: "Curl failed: \(errorMsg)"))
                }
            } catch {
                continuation.resume(throwing: error)
            }
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
