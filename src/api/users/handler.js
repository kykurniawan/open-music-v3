class UsersHandler {
    constructor(service, validator) {
        this._service = service
        this._validator = validator

        this.postUserHandler = this.postUserHandler.bind(this)
        this.getUserByIdHandler = this.getUserByIdHandler.bind(this)
        this.getUsersByUsernameHandler = this.getUsersByUsernameHandler.bind(this)
    }

    async postUserHandler({ payload }, h) {
        this._validator.validateUserPayload(payload)
        const { username, password, fullname } = payload

        const userId = await this._service.addUser({ username, password, fullname })

        const response = h.response({
            status: "success",
            message: "User berhasil ditambahkan",
            data: {
                userId,
            },
        })
        response.code(201)
        return response
    }

    async getUserByIdHandler({ params }) {
        const { id } = params
        const user = await this._service.getUserById(id)

        return {
            status: "success",
            data: {
                user,
            },
        }
    }

    async getUsersByUsernameHandler({ query }) {
        const { username = "" } = query
        const users = await this._service.getUsersByUsername(username)
        return {
            status: "success",
            data: {
                users,
            },
        }
    }
}

module.exports = UsersHandler