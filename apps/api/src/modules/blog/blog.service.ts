import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  // ─── Posts ──────────────────────────────────────

  async createPost(data: {
    title: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    featuredImage?: string;
    status?: string;
    publishedAt?: string;
    metaTitle?: string;
    metaDesc?: string;
    authorId: number;
    categoryIds?: number[];
    tagIds?: number[];
  }) {
    const slug =
      data.slug ||
      data.title
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9\-]/g, "")
        .toLowerCase();
    const existing = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (existing)
      throw new BadRequestException("این اسلاگ قبلاً استفاده شده است");

    return this.prisma.blogPost.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt,
        featuredImage: data.featuredImage,
        status: (data.status as any) || "DRAFT",
        publishedAt:
          data.status === "PUBLISHED"
            ? data.publishedAt
              ? new Date(data.publishedAt)
              : new Date()
            : data.publishedAt
              ? new Date(data.publishedAt)
              : null,
        metaTitle: data.metaTitle,
        metaDesc: data.metaDesc,
        authorId: data.authorId,
        categories: data.categoryIds?.length
          ? { create: data.categoryIds.map((id) => ({ categoryId: id })) }
          : undefined,
        tags: data.tagIds?.length
          ? { create: data.tagIds.map((id) => ({ tagId: id })) }
          : undefined,
      },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        author: { select: { id: true, name: true } },
      },
    });
  }

  async updatePost(
    id: number,
    data: {
      title?: string;
      slug?: string;
      content?: string;
      excerpt?: string;
      featuredImage?: string;
      status?: string;
      publishedAt?: string;
      metaTitle?: string;
      metaDesc?: string;
      categoryIds?: number[];
      tagIds?: number[];
    },
  ) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException("پست یافت نشد");

    if (data.slug) {
      const existing = await this.prisma.blogPost.findUnique({
        where: { slug: data.slug },
      });
      if (existing && existing.id !== id)
        throw new BadRequestException("این اسلاگ قبلاً استفاده شده است");
    }

    if (data.categoryIds !== undefined) {
      await this.prisma.blogPostCategory.deleteMany({ where: { postId: id } });
    }
    if (data.tagIds !== undefined) {
      await this.prisma.blogPostTag.deleteMany({ where: { postId: id } });
    }

    const updateData: any = { ...data };
    delete updateData.categoryIds;
    delete updateData.tagIds;

    if (
      data.status === "PUBLISHED" &&
      post.status !== "PUBLISHED" &&
      !data.publishedAt
    ) {
      updateData.publishedAt = new Date();
    } else if (data.publishedAt) {
      updateData.publishedAt = new Date(data.publishedAt);
    } else if (data.publishedAt === null) {
      updateData.publishedAt = null;
    }

    return this.prisma.blogPost.update({
      where: { id },
      data: {
        ...updateData,
        categories:
          data.categoryIds !== undefined
            ? {
                create: data.categoryIds.map((id) => ({ categoryId: id })),
              }
            : undefined,
        tags:
          data.tagIds !== undefined
            ? {
                create: data.tagIds.map((id) => ({ tagId: id })),
              }
            : undefined,
      },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        author: { select: { id: true, name: true } },
      },
    });
  }

  async getPosts(query: {
    page?: number;
    limit?: number;
    status?: string;
    categoryId?: number;
    tagId?: number;
    search?: string;
    authorId?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.authorId) where.authorId = query.authorId;
    if (query.categoryId)
      where.categories = { some: { categoryId: query.categoryId } };
    if (query.tagId) where.tags = { some: { tagId: query.tagId } };
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { excerpt: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        include: {
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
          author: { select: { id: true, name: true, avatar: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPost(id: number) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        author: { select: { id: true, name: true, avatar: true } },
        _count: { select: { comments: true } },
      },
    });
    if (!post) throw new NotFoundException("پست یافت نشد");
    return post;
  }

  async getPostBySlug(slug: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { slug },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        author: { select: { id: true, name: true, avatar: true } },
        _count: { select: { comments: true } },
      },
    });
    if (!post || post.status !== "PUBLISHED")
      throw new NotFoundException("پست یافت نشد");

    await this.prisma.blogPost.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    });

    return { ...post, viewCount: post.viewCount + 1 };
  }

  async deletePost(id: number) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException("پست یافت نشد");
    await this.prisma.blogPost.delete({ where: { id } });
    return { message: "پست حذف شد" };
  }

  // ─── Categories ─────────────────────────────────

  async createCategory(data: {
    name: string;
    slug?: string;
    description?: string;
    parentId?: number;
    sortOrder?: number;
  }) {
    const slug =
      data.slug ||
      data.name
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9\-]/g, "")
        .toLowerCase();
    const existing = await this.prisma.blogCategory.findUnique({
      where: { slug },
    });
    if (existing)
      throw new BadRequestException("این اسلاگ قبلاً استفاده شده است");
    return this.prisma.blogCategory.create({ data: { ...data, slug } });
  }

  async updateCategory(
    id: number,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      parentId?: number;
      sortOrder?: number;
    },
  ) {
    const cat = await this.prisma.blogCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException("دسته‌بندی یافت نشد");
    if (data.slug) {
      const existing = await this.prisma.blogCategory.findUnique({
        where: { slug: data.slug },
      });
      if (existing && existing.id !== id)
        throw new BadRequestException("این اسلاگ قبلاً استفاده شده است");
    }
    return this.prisma.blogCategory.update({ where: { id }, data });
  }

  async getCategories() {
    const cats = await this.prisma.blogCategory.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { sortOrder: "asc" },
    });
    const map = new Map<number, any>();
    const roots: any[] = [];
    for (const cat of cats) {
      map.set(cat.id, { ...cat, children: [] });
    }
    for (const cat of map.values()) {
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId).children.push(cat);
      } else {
        roots.push(cat);
      }
    }
    return roots;
  }

  async deleteCategory(id: number) {
    await this.prisma.blogCategory.delete({ where: { id } });
    return { message: "دسته‌بندی حذف شد" };
  }

  // ─── Tags ────────────────────────────────────────

  async createTag(data: { name: string; slug?: string }) {
    const slug =
      data.slug ||
      data.name
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9\-]/g, "")
        .toLowerCase();
    const existing = await this.prisma.blogTag.findUnique({ where: { slug } });
    if (existing)
      throw new BadRequestException("این اسلاگ قبلاً استفاده شده است");
    return this.prisma.blogTag.create({ data: { name: data.name, slug } });
  }

  async getTags() {
    return this.prisma.blogTag.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: "asc" },
    });
  }

  async deleteTag(id: number) {
    await this.prisma.blogTag.delete({ where: { id } });
    return { message: "برچسب حذف شد" };
  }

  // ─── Comments ────────────────────────────────────

  async createComment(data: {
    content: string;
    postId: number;
    name?: string;
    email?: string;
    website?: string;
    parentId?: number;
    userId?: number;
  }) {
    return this.prisma.blogComment.create({
      data: {
        content: data.content,
        postId: data.postId,
        name: data.name,
        email: data.email,
        website: data.website,
        parentId: data.parentId || null,
        userId: data.userId || null,
        isApproved: false,
      },
    });
  }

  async getComments(query: {
    postId?: number;
    isApproved?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.postId) where.postId = query.postId;
    if (query.isApproved === "approved") where.isApproved = true;
    else if (query.isApproved === "pending") where.isApproved = false;

    const [data, total] = await Promise.all([
      this.prisma.blogComment.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          post: { select: { id: true, title: true, slug: true } },
          replies: {
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.blogComment.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async approveComment(id: number, approved: boolean) {
    return this.prisma.blogComment.update({
      where: { id },
      data: { isApproved: approved },
    });
  }

  async deleteComment(id: number) {
    await this.prisma.blogComment.delete({ where: { id } });
    return { message: "نظر حذف شد" };
  }
}
