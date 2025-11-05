export const dynamic = "force-dynamic";

async function getTags() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  try {
    const res = await fetch(`${apiUrl}/api/v1/tags`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch tags: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching tags:", error);
    throw new Error(
      `Unable to connect to backend at ${apiUrl}. Make sure the server is running on port 4000.`
    );
  }
}

export default async function TagsPage() {
  const tags = await getTags();

  return (
    <div className="prose max-w-none p-8">
      <h1>Tags</h1>
      <ul>
        {tags.map(
          (tag: { slug: string; name: string; countOfPosts: number }) => (
            <li key={tag.slug}>
              {tag.name} ({tag.countOfPosts})
            </li>
          )
        )}
      </ul>
    </div>
  );
}
