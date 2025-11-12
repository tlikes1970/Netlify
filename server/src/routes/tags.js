import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Process: Get All Tags
 * Purpose: Return array of tags with post counts
 * Data Source: Prisma tags query with count aggregation
 * Update Path: N/A - read-only
 * Dependencies: Prisma client
 */
export async function getTags(request, res, next) {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const transformedTags = tags.map((tag) => ({
      slug: tag.slug,
      name: tag.name,
      countOfPosts: tag._count.posts,
    }));

    res.json(transformedTags);
  } catch (error) {
    next(error);
  }
}

/**
 * Process: Create or Get Tags
 * Purpose: Create tags if they don't exist, return existing tags with slugs
 * Data Source: Prisma tags - create or find existing
 * Update Path: Creates new tags in database
 * Dependencies: Prisma client
 */
export async function createOrGetTags(request, res, next) {
  try {
    const { tagNames } = request.body;

    if (!Array.isArray(tagNames) || tagNames.length === 0) {
      return res.status(400).json({ error: "tagNames must be a non-empty array" });
    }

    // Normalize tag names: trim, lowercase, create slug
    const normalizedTags = tagNames.map((name) => {
      const trimmed = name.trim();
      const slug = trimmed
        .toLowerCase()
        .replace(/[^\da-z]+/g, "-")
        .replace(/^-|-$/g, "");
      return { name: trimmed, slug };
    }).filter((tag) => tag.name.length > 0 && tag.slug.length > 0);

    if (normalizedTags.length === 0) {
      return res.status(400).json({ error: "No valid tag names provided" });
    }

    // Create or get tags
    const tagResults = await Promise.all(
      normalizedTags.map(async ({ name, slug }) => {
        // Try to find existing tag by slug
        let tag = await prisma.tag.findUnique({
          where: { slug },
        });

        // If not found, create it
        if (!tag) {
          tag = await prisma.tag.create({
            data: {
              name,
              slug,
            },
          });
        }

        return {
          slug: tag.slug,
          name: tag.name,
        };
      })
    );

    res.json({ tags: tagResults });
  } catch (error) {
    // Handle unique constraint violation (slug already exists)
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Tag with this slug already exists" });
    }
    next(error);
  }
}














