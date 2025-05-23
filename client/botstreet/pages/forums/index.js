import { useContext, useEffect } from "react"
import useSWR from "swr"
import ForumFeed from "../../components/ForumFeed"
import Suggestions from "../../components/Suggestions"
import ThemeContext from "@/contexts/ThemeContext"
import HomeHeader from "@/components/homeheader"
import { useRouter } from "next/router"
const fetcher = url => fetch(url).then(res => res.json())

export default function Forums() {
    const { theme } = useContext(ThemeContext)
    const isDark = theme === "dark"

    const user_id = typeof window !== "undefined" ? localStorage.getItem("userId") : null
    const router = useRouter()

useEffect(() => {
    const user_id = localStorage.getItem('userId')
    console.log(user_id)
    if (!user_id) {
        router.replace('/')  // redirects to homepage if not logged in
    }
}, [])
    const { data: allPosts, error: allPostsError, mutate: mutateAllPosts, isLoading: loadingAllPosts } = useSWR(
        `http://localhost:3000/api/post/?user_id=${user_id}`,
        fetcher,
        { refreshInterval: 10000 }
    )

    const { data: feedPosts, error: feedPostsError, mutate: mutateFeedPosts, isLoading: loadingFeedPosts } = useSWR(
        `http://localhost:3000/api/post/feed/${user_id}`,
        fetcher,
        { refreshInterval: 10000 }
    )

    const loading = loadingAllPosts || loadingFeedPosts
    const error = allPostsError || feedPostsError

    const handleNewPost = async (postContent) => {
        try {
            const user_id = localStorage.getItem('userId')

            if (!user_id) return router.push('/signin')

            const response = await fetch('http://localhost:3000/api/post/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id,
                    post_content: postContent.content,
                }),
            })

            if (response.ok) {
                mutateFeedPosts()
                mutateAllPosts()
                return true
            } else {
                const data = await response.json()
                console.error('Failed to create post:', data.message)
                return false
            }
        } catch (err) {
            console.error('Error creating post:', err)
            return false
        }
    }

    const handleLikePost = async (post_id) => {
        try {
            const user_id = localStorage.getItem('userId')
            if (!user_id) return router.push('/signin')

            const response = await fetch("http://localhost:3000/api/post/likes", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id, post_id }),
            })

            if (response.ok) {
                mutateFeedPosts()
                mutateAllPosts()
            } else {
                console.error('Failed to like post')
            }
        } catch (err) {
            console.error('Error liking post:', err)
        }
    }

    const handleCommentPost = async (post_id, comment_text) => {
        try {
            const user_id = localStorage.getItem('userId')
            if (!user_id) return router.push('/signin')

            const response = await fetch('http://localhost:3000/api/post/comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id, post_id, comment_text }),
            })

            if (response.ok) {
                mutateFeedPosts()
                mutateAllPosts()
            } else {
                console.error('Failed to comment on post')
            }
        } catch (err) {
            console.error('Error commenting on post:', err)
        }
    }

    return (
        <div className={`min-h-screen ${isDark ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-800"} transition-colors duration-200 flex flex-col`}>
            <HomeHeader />
            <main className="flex-1 container mx-auto px-4 mt-4">
                <div className={`w-full py-8 rounded-lg shadow-sm ${isDark ? "bg-gray-800" : "bg-gradient-to-r from-indigo-50 to-blue-50"} mb-6`}>
                    <div className="text-center">
                        <h1 className={`text-3xl md:text-4xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
                            BotStreet <span className="text-indigo-500">Forums</span>
                        </h1>
                        <p className={`mt-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                            Connect with the community, share ideas, and get inspired.
                        </p>
                        <div className="w-24 h-1 bg-indigo-500 mx-auto mt-4" />
                    </div>
                </div>

                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
                    <div className={`flex-1 border ${isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"} rounded-lg shadow-sm`}>
                        {loading ? (
                            <div className="flex justify-center items-center h-32">
                                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDark ? "border-blue-400" : "border-indigo-600"}`} />
                            </div>
                        ) : error ? (
                            <div className={`p-4 text-center ${isDark ? "text-red-400" : "text-red-600"}`}>Failed to load posts</div>
                        ) : (
                            <ForumFeed
                                allPosts={allPosts}
                                feedPosts={feedPosts}
                                onNewPost={handleNewPost}
                                onLikePost={handleLikePost}
                                onCommentPost={handleCommentPost}
                            />
                        )}
                    </div>

                    <div className="md:w-80 flex-shrink-0">
                        <div className={`rounded-lg shadow-sm p-4 ${isDark ? "bg-gray-800" : "bg-white"} sticky top-20`}>
                            <Suggestions />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
