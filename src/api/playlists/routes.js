const routes = (handler) => [
    {
        method: "POST",
        path: "/playlists",
        handler: handler.postPlaylistHandler,
        options: {
            auth: "musicapp_jwt",
        },
    },
    {
        method: "POST",
        path: "/playlists/{playlistId}/songs",
        handler: handler.postPlaylistSongHandler,
        options: {
            auth: "musicapp_jwt"
        }
    },
    {
        method: "GET",
        path: "/playlists",
        handler: handler.getPlaylistsHandler,
        options: {
            auth: "musicapp_jwt",
        },
    },
    {
        method: "GET",
        path: "/playlists/{playlistId}/songs",
        handler: handler.getPlaylistSongsHandler,
        options: {
            auth: "musicapp_jwt",
        },
    },
    {
        method: "DELETE",
        path: "/playlists/{id}",
        handler: handler.deletePlaylistByIdHandler,
        options: {
            auth: "musicapp_jwt",
        },
    },
    {
        method: "DELETE",
        path: "/playlists/{playlistId}/songs",
        handler: handler.deletePlaylistSongByIdHandler,
        options: {
            auth: "musicapp_jwt",
        },
    }
]

module.exports = routes