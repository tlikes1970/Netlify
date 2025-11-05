export const dynamic = "force-dynamic";

async function getPost(slug: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  try {
    const res = await fetch(`${apiUrl}/api/v1/posts/${slug}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch post: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching post:", error);
    throw new Error(
      `Unable to connect to backend at ${apiUrl}. Make sure the server is running on port 4000.`
    );
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  const publishDate = new Date(post.publishedAt).toLocaleDateString();

  return (
    <div className="prose max-w-none p-8">
      <h1>{post.title}</h1>
      <p>
        <strong>Author:</strong> {post.author.username}
      </p>
      <p>
        <strong>Published:</strong> {publishDate}
      </p>
      <div>{post.content}</div>
    </div>
  );
}
