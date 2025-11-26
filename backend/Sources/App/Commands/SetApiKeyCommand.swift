import Vapor
import Fluent

struct SetApiKeyCommand: Command {
    struct Signature: CommandSignature {
        @Argument(name: "key")
        var key: String
    }

    var help: String {
        "Sets the 1fichier API Key in the database."
    }

    func run(using context: CommandContext, signature: Signature) throws {
        let db = context.application.db
        
        // Check if settings exist
        if let settings = try Setting.query(on: db).first().wait() {
            settings.onefichierApiKey = signature.key
            try settings.save(on: db).wait()
            context.console.print("API Key updated successfully!")
        } else {
            // Create new settings
            let settings = Setting(onefichierApiKey: signature.key)
            try settings.save(on: db).wait()
            context.console.print("API Key set successfully (new settings created)!")
        }
    }
}
