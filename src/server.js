require("dotenv").config()

const Hapi = require("@hapi/hapi")
const Jwt = require("@hapi/jwt")
const process = require("process")
const path = require("path")
const Inert = require("@hapi/inert")
const ClientError = require("./exceptions/ClientError")

// songs
const songs = require("./api/songs")
const SongsService = require("./services/postgres/SongsService")
const SongValidator = require("./validator/songs")

// playlists
const playlists = require("./api/playlists")
const PlaylistsService = require("./services/postgres/PlaylistsService")
const PlaylistValidator = require("./validator/playlists")

// users
const users = require("./api/users")
const UsersService = require("./services/postgres/UsersService")
const UsersValidator = require("./validator/users")

// authentications
const authentications = require("./api/authentications")
const AuthenticationsService = require("./services/postgres/AuthenticationsService")
const TokenManager = require("./tokenize/TokenManager")
const AuthenticationsValidator = require("./validator/authentications")

// Exports
const _exports = require("./api/exports")
const ProducerService = require("./services/rabbitmq/ProducerService")
const ExportsValidator = require("./validator/exports")

// uploads
const uploads = require("./api/uploads")
const StorageService = require("./services/storage/StorageService")
const UploadsValidator = require("./validator/uploads")

// cache
const CacheService = require("./services/redis/CacheService")

const init = async () => {
    const cacheService = new CacheService()
    const songsService = new SongsService()
    const playlistsService = new PlaylistsService(cacheService)
    const usersService = new UsersService()
    const authenticationsService = new AuthenticationsService()
    const storageService = new StorageService(path.resolve(__dirname, "api/uploads/file/pictures"))

    const server = Hapi.server({
        port: process.env.APP_PORT,
        host: process.env.APP_HOST,
        routes: {
            cors: {
                origin: ["*"],
            }
        }
    })

    await server.register([
        {
            plugin: Jwt
        },
        {
            plugin: Inert,
        },
    ])

    server.auth.strategy("musicapp_jwt", "jwt", {
        keys: process.env.ACCESS_TOKEN_KEY,
        verify: {
            aud: false,
            iss: false,
            sub: false,
            maxAgeSec: process.env.ACCESS_TOKEN_AGE
        },
        validate: (artifacts) => ({
            isValid: true,
            credentials: {
                id: artifacts.decoded.payload.id,
            }
        })
    })

    await server.register([
        {
            plugin: songs,
            options: {
                service: songsService,
                validator: SongValidator
            }
        },
        {
            plugin: playlists,
            options: {
                service: playlistsService,
                validator: PlaylistValidator
            }
        },
        {
            plugin: users,
            options: {
                service: usersService,
                validator: UsersValidator,
            },
        },
        {
            plugin: authentications,
            options: {
                authenticationsService,
                usersService,
                tokenManager: TokenManager,
                validator: AuthenticationsValidator,
            },
        },
        {
            plugin: _exports,
            options: {
                service: ProducerService,
                playlistsService: playlistsService,
                validator: ExportsValidator,
            },
        },
        {
            plugin: uploads,
            options: {
                service: storageService,
                validator: UploadsValidator,
            },
        },
    ])

    server.ext("onPreResponse", (request, h) => {

        const { response } = request

        if (response instanceof Error) {
            if (response instanceof ClientError) {
                const newResponse = h.response({
                    status: "fail",
                    message: response.message,
                })
                newResponse.code(response.statusCode)
                return newResponse
            }

            if (response.statusCode === 500) {
                const newResponse = h.response({
                    status: response.statusCode,
                    message: "Maaf, terjadi kegagalan pada server kami.",
                })
                newResponse.code(response.statusCode)
                console.error(response.statusCode)
                return newResponse
            }

        }

        return response.continue || response

    })

    await server.start()
    console.log(`Server running on ${server.info.uri}`)
}

init()