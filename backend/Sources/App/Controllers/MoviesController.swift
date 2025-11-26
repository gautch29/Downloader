import Vapor

struct MoviesController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let movies = routes.grouped("api", "movies")
        movies.get("search", use: search)
        movies.post("links", use: getLinks)
        movies.post("episodes") { req async throws -> LinksResponse in
            return try await self.getEpisodes(req: req)
        }
    }

    func search(req: Request) async throws -> SearchResult {
        guard let query = req.query[String.self, at: "q"] else {
            throw Abort(.badRequest, reason: "Missing query parameter")
        }
        
        let scraper = ScraperService(client: req.client)
        return try await scraper.searchMovies(query: query)
    }

    struct LinksRequest: Content {
        var url: String
    }
    
    struct LinksResponse: Content {
        var links: [String]
    }

    func getLinks(req: Request) async throws -> LinksResponse {
        let linksReq = try req.content.decode(LinksRequest.self)
        let scraper = ScraperService(client: req.client)
        let links = try await scraper.scrapeDetail(url: linksReq.url)
        
        return LinksResponse(links: links)
    }

    func getEpisodes(req: Request) async throws -> LinksResponse {
        let linksReq = try req.content.decode(LinksRequest.self)
        let scraper = ScraperService(client: req.client)
        let links = try await scraper.getEpisodeLinks(url: linksReq.url)
        
        return LinksResponse(links: links)
    }
}
