import { PrismaClient } from "@prisma/client";
import { getFirestore } from "../lib/firebaseAdmin.js";

const prisma = new PrismaClient();

/**
 * Process: Get Posts List
 * Purpose: Return paginated, filtered, and sorted posts
 * Data Source: Prisma posts query with joins
 * Update Path: N/A - read-only
 * Dependencies: Prisma client
 */
export async function getPosts(request, res, next) {
  try {
    const page = Number.parseInt(request.query.page) || 1;
    const pageSize = Math.min(
      Number.parseInt(request.query.pageSize) || 20,
      100
    );
    const sort = request.query.sort || "newest";
    const tagSlug = request.query.tag;

    // NEW: debug param to artificially limit Prisma rows
    const primaLimit = request.query.prima_limit
      ? Number.parseInt(request.query.prima_limit)
      : undefined;

    // Build where clause (null-safe)
    const where = {};
    if (tagSlug) {
      where.tags = {
        some: {
          tag: {
            slug: tagSlug,
          },
        },
      };
    }

    // Only add the NOT clause if we have a real Date
    // (we don't actually need this filter for Phase-4 – remove it)

    // Build orderBy clause
    const orderBy =
      sort === "newest" ? { publishedAt: "desc" } : { publishedAt: "asc" };

    // Prisma query (capped if debug param supplied)
    const prismaPosts = await prisma.post.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: primaLimit === undefined ? pageSize : primaLimit, // Use pageSize normally, or debug limit if provided
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                slug: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Get total count (must match the where clause used in findMany)
    const total = await prisma.post.count({
      where,
    });

    // Use prismaPosts as posts for transformation
    const posts = prismaPosts;

    // Transform Prisma posts tags array and ensure author is always defined
    let transformedPosts = posts.map((post) => ({
      ...post,
      author: post.author || {
        id: null,
        username: "Unknown",
        email: null,
        profile: { avatarUrl: null },
      },
      tags: (Array.isArray(post.tags) ? post.tags : [])
        .map((pt) => pt?.tag)
        .filter(Boolean), // Filter out any null/undefined tags
    }));

    // Firestore fallback: on page 1, always try to fill the page with Firestore if Prisma can't fill it
    // (ignores total count - ensures new Firestore posts appear even if Prisma has many posts)
    if (page === 1) {
      try {
        const database = await getFirestore();
        if (database) {
          // Get Prisma post slugs to exclude duplicates
          const prismaSlugs = new Set(transformedPosts.map((p) => p.slug));

          // Query Firestore for additional posts
          let firestoreQuery = database
            .collection("posts")
            .orderBy("publishedAt", "desc");

          // Apply tag filter if specified
          if (tagSlug) {
            firestoreQuery = firestoreQuery.where(
              "tagSlugs",
              "array-contains",
              tagSlug
            );
          }

          // Get enough to fill remaining slots (fetch a few extra to account for duplicates)
          const neededCount = pageSize - transformedPosts.length;
          const firestoreSnapshot = await firestoreQuery
            .limit(neededCount * 2)
            .get();

          // Transform Firestore docs to match Prisma post shape
          const firestorePosts = firestoreSnapshot.docs
            .map((document) => {
              const data = document.data();
              const publishedAt = data.publishedAt?.toDate
                ? data.publishedAt.toDate().toISOString()
                : data.publishedAt;

              return {
                id: document.id,
                slug: data.slug,
                title: data.title || "",
                excerpt: data.excerpt || "",
                content: data.body || data.content || "",
                body: data.body || data.content || "",
                publishedAt,
                author: {
                  id: data.authorId || "",
                  username: data.authorName || "Anonymous",
                  name: data.authorName || "Anonymous",
                  email: data.authorEmail || null,
                  profile: {
                    avatarUrl: data.authorAvatar || null,
                  },
                },
                tags: (data.tagSlugs || []).map((slug) => ({
                  slug,
                  name: slug,
                })),
              };
            })
            .filter((post) => !prismaSlugs.has(post.slug))
            .slice(0, neededCount); // Take exactly what we need

          // Concatenate: Prisma posts first, then Firestore posts
          transformedPosts = [...transformedPosts, ...firestorePosts];

          // Update total count (add Firestore posts count to Prisma count)
          // Approximate: add number of Firestore posts fetched (simplified for performance)
          const updatedTotal = total + firestorePosts.length;

          res.json({
            posts: transformedPosts,
            total: updatedTotal,
            page,
            pageSize,
          });
          return;
        }
      } catch (firestoreError) {
        // Log but don't fail - return Prisma results only
        // eslint-disable-next-line no-console
        console.error(
          "[Firestore] Fallback query error:",
          firestoreError.message
        );
      }
    }

    // Return Prisma results only (if no Firestore fallback needed or if Firestore failed)
    res.json({
      posts: transformedPosts,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    // Log detailed error information for debugging
    console.error("[getPosts] Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
    });
    next(error);
  }
}

/**
 * Process: Get Single Post
 * Purpose: Return single post by slug with author and tags inlined
 * Data Source: Prisma post query (primary), Firestore (fallback)
 * Update Path: N/A - read-only
 * Dependencies: Prisma client, Firebase Admin SDK
 */
export async function getPostBySlug(request, res, next) {
  try {
    const { slug } = request.params;

    // Try Prisma first (primary source)
    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: {
              select: {
                bio: true,
                avatarUrl: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                slug: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // If not found in Postgres, try Firestore fallback
    if (!post) {
      try {
        const database = await getFirestore();
        if (database) {
          const postsReference = database.collection("posts");
          const snapshot = await postsReference
            .where("slug", "==", slug)
            .limit(1)
            .get();

          // ----- Firestore fallback -----
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data();

            return res.json({
              id: snapshot.docs[0].id,
              title: data.title,
              excerpt: data.excerpt,
              body: data.body,
              slug: data.slug,
              author: {
                id: data.authorId,
                name: data.authorName,
                avatar: data.authorAvatar,
              },
              tags: data.tagSlugs.map((s) => ({ slug: s, name: s })), // temp names
              publishedAt: data.publishedAt.toDate().toISOString(),
            });
          }
        }
      } catch (firestoreError) {
        // Log but don't fail - fall through to 404
        console.error(
          "[Firestore] Fallback lookup error:",
          firestoreError.message
        );
      }
    }

    if (!post) {
      return res.status(404).json({ error: "Not found" });
    }

    // Transform tags array (for Prisma posts)
    const transformedPost = {
      ...post,
      tags: post.tags.map((pt) => pt.tag || pt), // Handle both Prisma and Firestore formats
    };

    res.json(transformedPost);
  } catch (error) {
    next(error);
  }
}

/**
 * Process: Get Post Comments
 * Purpose: Return comments for a post, sorted oldest to newest
 * Data Source: Prisma comments query (primary), Firestore (fallback)
 * Update Path: N/A - read-only
 * Dependencies: Prisma client, Firebase Admin SDK
 */
export async function getPostComments(request, res, next) {
  try {
    const { slug } = request.params;

    // First verify post exists in Prisma
    const post = await prisma.post.findUnique({
      where: { slug },
      select: { id: true },
    });

    // If post found in Prisma, get comments
    if (post) {
      const comments = await prisma.comment.findMany({
        where: { postId: post.id },
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: {
              username: true,
              profile: {
                select: {
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      // Transform to include author name and avatar
      const transformedComments = comments.map((comment) => ({
        ...comment,
        author: {
          name: comment.author.username,
          avatar: comment.author.profile?.avatarUrl || null,
        },
      }));

      return res.json(transformedComments);
    }

    // Post not found in Prisma, try Firestore fallback
    try {
      const database = await getFirestore();
      if (database) {
        const postsReference = database.collection("posts");
        const snapshot = await postsReference
          .where("slug", "==", slug)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          // Post exists in Firestore, return empty comments array
          return res.json([]);
        }
      }
    } catch (firestoreError) {
      // Log but don't fail - fall through to 404
      console.error(
        "[Firestore] Comments fallback lookup error:",
        firestoreError.message
      );
    }

    // Post not found in either Prisma or Firestore
    return res.status(404).json({ error: "Not found" });
  } catch (error) {
    next(error);
  }
}
