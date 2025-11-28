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
    let ztBaseURL = "https://www.zone-telechargement.irish"

    init(client: Client) {
        self.client = client
        self.apiKey = Environment.get("ONEFICHIER_API_KEY")
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
            // Do not capture stderr
            
            do {
                try process.run()
                
                let data = pipe.fileHandleForReading.readDataToEndOfFile()
                process.waitUntilExit()
                
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
                    continuation.resume(throwing: Abort(.internalServerError, reason: "Curl failed with status \(process.terminationStatus)"))
                }
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }

    func searchMovies(query: String) async throws -> SearchResult {
        return try await runNodeScript(command: "search", arg: query)
    }
    
    func scrapeDetail(url: String) async throws -> [String] {
        let response: LinksResponse = try await runNodeScript(command: "links", arg: url)
        return response.links
    }
    
    func getEpisodeLinks(url: String) async throws -> [String] {
        // The wrapper handles both movies and series links logic
        let response: LinksResponse = try await runNodeScript(command: "links", arg: url)
        return response.links
    }
    
    private func runNodeScript<T: Decodable>(command: String, arg: String) async throws -> T {
        return try await withCheckedThrowingContinuation { continuation in
            let process = Process()
            process.executableURL = URL(fileURLWithPath: "/usr/bin/node")
            
            // Assuming the script is in the working directory or a known path
            // In a real deployment, you'd want a robust way to find this path
            let scriptPath = URL(fileURLWithPath: #file).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent("NodeAPI/wrapper.js").path
            
            process.arguments = [scriptPath, command, arg]
            
            let pipe = Pipe()
            process.standardOutput = pipe
            
            do {
                try process.run()
                
                let data = pipe.fileHandleForReading.readDataToEndOfFile()
                process.waitUntilExit()
                
                if process.terminationStatus == 0 {
                    do {
                        let result = try JSONDecoder().decode(T.self, from: data)
                        continuation.resume(returning: result)
                    } catch {
                        print("[DEBUG] Node Output: \(String(data: data, encoding: .utf8) ?? "nil")")
                        continuation.resume(throwing: error)
                    }
                } else {
                    continuation.resume(throwing: Abort(.internalServerError, reason: "Node script failed with status \(process.terminationStatus)"))
                }
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }
    
    // Helper struct for decoding links response from Node
    struct LinksResponse: Decodable {
        var links: [String]
    }
}
