import Vapor
import Fluent

struct CreateUserCommand: Command {
    struct Signature: CommandSignature {
        @Argument(name: "username")
        var username: String
        
        @Argument(name: "password")
        var password: String
    }

    var help: String {
        "Creates a new user with the provided username and password."
    }

    func run(using context: CommandContext, signature: Signature) throws {
        let passwordHash = try Bcrypt.hash(signature.password)
        let user = User(username: signature.username, passwordHash: passwordHash)
        
        try user.save(on: context.application.db).wait()
        
        context.console.print("User '\(signature.username)' created successfully!")
    }
}
