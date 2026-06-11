import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
const sanitizeHtml = require("sanitize-html");

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.page.findMany({ orderBy: { sortOrder: "asc" } });
  }

  async findActive() {
    const now = new Date();
    return this.prisma.page.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ publishAt: null }, { publishAt: { lte: now } }] },
          { OR: [{ unpublishAt: null }, { unpublishAt: { gte: now } }] },
        ],
      },
      orderBy: { sortOrder: "asc" },
    });
  }

  async findBySlug(slug: string) {
    const now = new Date();
    const page = await this.prisma.page.findUnique({ where: { slug } });
    if (!page || !page.isActive) throw new NotFoundException("Page not found");
    const publishOk = !page.publishAt || page.publishAt <= now;
    const unpublishOk = !page.unpublishAt || page.unpublishAt >= now;
    if (!publishOk || !unpublishOk)
      throw new NotFoundException("Page not found");
    return page;
  }

  async findPreview(id: number) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundException("Page not found");
    return page;
  }

  async findOne(id: number) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundException("Page not found");
    return page;
  }

  async create(data: {
    title: string;
    slug: string;
    type?: string;
    status?: string;
    content?: string;
    contentJson?: string;
    metaTitle?: string;
    metaDesc?: string;
    isActive?: boolean;
    sortOrder?: number;
    publishAt?: string;
    unpublishAt?: string;
  }) {
    if (data.contentJson) {
      data.contentJson = this.validateContentJson(data.contentJson);
    }
    const { publishAt, unpublishAt, ...rest } = data;
    return this.prisma.page.create({
      data: {
        ...rest,
        publishAt: publishAt ? new Date(publishAt) : undefined,
        unpublishAt: unpublishAt ? new Date(unpublishAt) : undefined,
        slug: data.slug || data.title.replace(/\s+/g, "-").toLowerCase(),
        type: (data.type as any) || "LANDING",
        status: (data.status as any) || "DRAFT",
      },
    });
  }

  async update(
    id: number,
    data: {
      title?: string;
      slug?: string;
      type?: string;
      status?: string;
      content?: string;
      contentJson?: string;
      metaTitle?: string;
      metaDesc?: string;
      isActive?: boolean;
      sortOrder?: number;
      publishAt?: string | null;
      unpublishAt?: string | null;
    },
    authorId?: number,
  ) {
    const page = await this.findOne(id);
    if (data.contentJson) {
      data.contentJson = this.validateContentJson(data.contentJson);
    }
    // Auto-save revision before updating
    if (data.contentJson && data.contentJson !== page.contentJson) {
      try {
        await this.saveRevision(
          id,
          page.title,
          data.contentJson,
          authorId,
          "ویرایش خودکار",
        );
      } catch {
        /* silent */
      }
    }
    const { publishAt, unpublishAt, ...rest } = data;
    const setData: any = { ...rest };
    if (publishAt !== undefined)
      setData.publishAt = publishAt ? new Date(publishAt) : null;
    if (unpublishAt !== undefined)
      setData.unpublishAt = unpublishAt ? new Date(unpublishAt) : null;
    return this.prisma.page.update({ where: { id }, data: setData });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.page.delete({ where: { id } });
  }

  async saveRevision(
    pageId: number,
    title: string,
    contentJson: string,
    authorId?: number,
    note?: string,
  ) {
    return this.prisma.pageRevision.create({
      data: {
        pageId,
        title,
        contentJson,
        authorId: authorId || null,
        note: note || null,
      },
    });
  }

  async getRevisions(pageId: number) {
    await this.findOne(pageId);
    return this.prisma.pageRevision.findMany({
      where: { pageId },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async restoreRevision(pageId: number, revisionId: number) {
    const page = await this.findOne(pageId);
    const revision = await this.prisma.pageRevision.findFirst({
      where: { id: revisionId, pageId },
    });
    if (!revision) throw new NotFoundException("نسخه یافت نشد");
    // Save current state as a revision before restoring
    if (page.contentJson && JSON.stringify(page.contentJson) !== revision.contentJson) {
      try {
        await this.saveRevision(
          pageId,
          page.title,
          page.contentJson as string,
          revision.authorId ?? undefined,
          "بازگردانی خودکار",
        );
      } catch {
        /* silent */
      }
    }
    return this.prisma.page.update({
      where: { id: pageId },
      data: { contentJson: revision.contentJson },
    });
  }

  private validateContentJson(json: string): any {
    let parsed: any;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new BadRequestException("contentJson: JSON نامعتبر است");
    }

    if (!parsed || typeof parsed !== "object") {
      throw new BadRequestException("contentJson: باید یک شیء JSON باشد");
    }

    if (parsed.schema_version !== 1) {
      throw new BadRequestException("contentJson: schema_version باید 1 باشد");
    }

    if (!Array.isArray(parsed.sections)) {
      throw new BadRequestException("contentJson: sections باید یک آرایه باشد");
    }

    if (parsed.sections.length > 50) {
      throw new BadRequestException("contentJson: حداکثر 50 بخش مجاز است");
    }

    const validWidgetTypes = [
      "heading",
      "text",
      "image",
      "button",
      "spacer",
      "icon_box",
      "video",
      "accordion",
      "tabs",
      "gallery",
      "banner_slider",
      "product_carousel",
      "product_grid",
      "category_nav",
      "brand_slider",
      "countdown",
      "blog_posts",
    ];

    const validVariants = [1, 2, 3];

    for (const [si, section] of parsed.sections.entries()) {
      if (!section.id || typeof section.id !== "string") {
        throw new BadRequestException(
          `بخش ${si}: id الزامی و باید string باشد`,
        );
      }
      if (!Array.isArray(section.columns)) {
        throw new BadRequestException(`بخش ${si}: columns باید یک آرایه باشد`);
      }
      if (section.columns.length > 6) {
        throw new BadRequestException(`بخش ${si}: حداکثر 6 ستون مجاز است`);
      }

      for (const [ci, column] of section.columns.entries()) {
        if (!Array.isArray(column.widgets)) {
          throw new BadRequestException(
            `بخش ${si} ستون ${ci}: widgets باید یک آرایه باشد`,
          );
        }
        if (column.widgets.length > 30) {
          throw new BadRequestException(
            `بخش ${si} ستون ${ci}: حداکثر 30 ویجت مجاز است`,
          );
        }

        for (const [wi, widget] of column.widgets.entries()) {
          if (!widget.id || typeof widget.id !== "string") {
            throw new BadRequestException(
              `بخش ${si} ستون ${ci} ویجت ${wi}: id الزامی`,
            );
          }
          if (!widget.type || !validWidgetTypes.includes(widget.type)) {
            throw new BadRequestException(
              `بخش ${si} ستون ${ci} ویجت ${wi}: type "${widget.type}" نامعتبر است`,
            );
          }
          if (
            widget.variant !== undefined &&
            !validVariants.includes(widget.variant)
          ) {
            throw new BadRequestException(
              `بخش ${si} ستون ${ci} ویجت ${wi}: variant "${widget.variant}" نامعتبر (باید 1-3 باشد)`,
            );
          }
        }
      }
    }

    // sanitize HTML fields in all widgets
    this.sanitizeContentJsonWidgets(parsed);

    return parsed;
  }

  private sanitizeContentJsonWidgets(parsed: any) {
    const allowedTags = [
      "b",
      "i",
      "u",
      "em",
      "strong",
      "a",
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "span",
      "div",
      "img",
      "blockquote",
      "pre",
      "code",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "hr",
      "sub",
      "sup",
      "small",
      "mark",
      "del",
      "ins",
    ];
    const allowedAttrs = {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
      "*": ["class", "style", "dir"],
    };
    const sanitize = (html: string) =>
      sanitizeHtml(html, { allowedTags, allowedAttributes: allowedAttrs });

    for (const section of parsed.sections || []) {
      for (const column of section.columns || []) {
        for (const widget of column.widgets || []) {
          const s = widget.settings || {};
          if (widget.type === "text") {
            if (s.html) s.html = sanitize(s.html);
          }
          if (widget.type === "heading") {
            if (s.text) s.text = sanitize(s.text);
          }
          if (widget.type === "accordion") {
            for (const item of s.items || []) {
              if (item.content_html)
                item.content_html = sanitize(item.content_html);
            }
          }
          if (widget.type === "tabs") {
            for (const tab of s.tabs || []) {
              if (tab.content_html)
                tab.content_html = sanitize(tab.content_html);
            }
          }
          if (widget.type === "icon_box") {
            if (s.title) s.title = sanitize(s.title);
            if (s.desc) s.desc = sanitize(s.desc);
          }
          if (widget.type === "banner_slider") {
            for (const slide of s.slides || []) {
              if (slide.title) slide.title = sanitize(slide.title);
              if (slide.subtitle) slide.subtitle = sanitize(slide.subtitle);
              if (slide.button_text)
                slide.button_text = sanitize(slide.button_text);
            }
          }
        }
      }
    }
  }
}
