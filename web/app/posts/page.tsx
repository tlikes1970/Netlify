export const dynamic = "force-dynamic"; // ← add this

async function getPosts() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  try {
    const res = await fetch(`${apiUrl}/api/v1/posts?pageSize=20`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch posts: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw new Error(
      `Unable to connect to backend at ${apiUrl}. Make sure the server is running on port 4000.`
    );
  }
}

export default async function PostsPage() {
  const data = await getPosts();

  return (
    <div className="prose max-w-none p-8">
      <h1>Posts</h1>
      <ul>
        {data.posts.map((post: { id: string; title: string; slug: string }) => (
          <li key={post.id}>
            <a href={`/posts/${post.slug}`}>{post.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
