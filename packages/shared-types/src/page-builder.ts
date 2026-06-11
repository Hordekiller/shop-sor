// ─── Color ───
export type ColorValue =
  | {
      mode: "global";
      token:
        | "primary"
        | "secondary"
        | "text"
        | "bg"
        | "muted"
        | "success"
        | "error"
        | "warning";
    }
  | { mode: "custom"; value: string }
  | { mode: "gradient"; from: string; to: string; angle: number };

// ─── Spacing ───
export type Spacing = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

// ─── Typography ───
export type Typography = {
  font_id: string | null;
  size: number;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  line_height: number;
  letter_spacing: number;
  align: "right" | "center" | "left" | "justify";
};

// ─── Data Source ───
export type DataSource = {
  mode: "auto" | "manual";
  filter?: {
    by:
      | "newest"
      | "bestseller"
      | "most_viewed"
      | "discounted"
      | "category"
      | "tag"
      | "brand";
    category_ids?: number[];
    tag_ids?: number[];
    brand_ids?: number[];
    in_stock_only?: boolean;
  };
  ids?: number[];
  limit: number;
};

// ─── Media Ref ───
export type MediaRef = {
  media_id: string;
  alt: string;
};

// ─── Link ───
export type LinkValue = {
  url: string;
  target: "_self" | "_blank";
  rel?: "nofollow" | "sponsored" | null;
};

// ─── Responsive Settings ───
export type Breakpoint = "desktop" | "tablet" | "mobile";

export type ResponsiveLayer = {
  visible: boolean;
  columns?: number;
  padding?: Spacing;
  margin?: Spacing;
  align?: "right" | "center" | "left";
};

export type ResponsiveSettings = {
  desktop: ResponsiveLayer;
  tablet: Partial<ResponsiveLayer>;
  mobile: Partial<ResponsiveLayer>;
};

// ─── Widget Types ───
export type WidgetType =
  | "heading"
  | "text"
  | "image"
  | "button"
  | "spacer"
  | "icon_box"
  | "video"
  | "accordion"
  | "tabs"
  | "gallery"
  | "banner_slider"
  | "product_carousel"
  | "product_grid"
  | "category_nav"
  | "brand_slider"
  | "countdown"
  | "blog_posts";

// ─── Base Widget Envelope ───
export type BaseWidget = {
  id: string;
  type: WidgetType;
  variant: 1 | 2 | 3;
  settings: Record<string, any>;
  style: {
    background?: ColorValue;
    padding?: Spacing;
    margin?: Spacing;
    border_radius?: number;
    box_shadow?: boolean;
  };
  responsive: ResponsiveSettings;
  seo?: { heading_level?: "h1" | "h2" | "h3" | "h4" };
};

// ─── Column ───
export type Column = {
  id: string;
  settings: {
    width_ratio: number;
    vertical_align?: "top" | "center" | "bottom";
    gap?: number;
  };
  widgets: BaseWidget[];
};

// ─── Section ───
export type Section = {
  id: string;
  settings: {
    background?: ColorValue;
    padding?: Spacing;
    margin?: Spacing;
    max_width?: number;
    full_width?: boolean;
  };
  columns: Column[];
};

// ─── Page Content ───
export type PageContent = {
  schema_version: number;
  sections: Section[];
};

// ─── Page Type ───
export type PageType =
  | "landing"
  | "blog_post"
  | "shop_landing"
  | "category_page"
  | "custom";
export type PageStatus = "draft" | "published";

// ─── Global Color Palette ───
export type GlobalColorPalette = {
  primary: string;
  secondary: string;
  text: string;
  bg: string;
  muted: string;
  success: string;
  error: string;
  warning: string;
};

// ─── Font Record ───
export type FontRecord = {
  id: number;
  name: string;
  source: "link" | "upload";
  url?: string;
  mediaId?: number;
  filepath?: string;
  weights: string;
  subsets?: string;
  isActive: boolean;
  isDefault: boolean;
};

// ─── Widget Settings (specific to each widget type) ───

export type HeadingSettings = {
  text: string;
  typography: Typography;
  color: ColorValue;
  badge?: { text: string; color: ColorValue } | null;
  link?: LinkValue | null;
};

export type TextSettings = {
  html: string;
  typography: Typography;
  color: ColorValue;
};

export type ImageSettings = {
  image: MediaRef;
  link?: LinkValue | null;
  caption?: string;
  lazy: boolean;
};

export type ButtonSettings = {
  text: string;
  link: LinkValue;
  bg: ColorValue;
  text_color: ColorValue;
  size: "sm" | "md" | "lg";
  icon?: string | null;
  full_width: boolean;
};

export type SpacerSettings = {
  height: number;
};

export type IconBoxSettings = {
  icon: string;
  title: string;
  desc?: string;
  color: ColorValue;
  link?: LinkValue;
};

export type VideoSettings = {
  source: "upload" | "youtube" | "aparat";
  media_id?: string;
  url?: string;
  poster?: MediaRef;
  autoplay: boolean;
  muted: boolean;
};

export type AccordionItem = {
  title: string;
  content_html: string;
};

export type AccordionSettings = {
  items: AccordionItem[];
  allow_multiple: boolean;
  style: "plus" | "chevron";
};

export type TabItem = {
  label: string;
  content_html: string;
};

export type TabsSettings = {
  tabs: TabItem[];
  orientation: "horizontal" | "vertical";
};

export type GallerySettings = {
  images: MediaRef[];
  columns: number;
  gap: number;
  lightbox: boolean;
};

export type BannerSlide = {
  image: MediaRef;
  link: LinkValue;
  title?: string;
  subtitle?: string;
  button_text?: string;
};

export type BannerSliderSettings = {
  slides: BannerSlide[];
  autoplay: boolean;
  loop: boolean;
  height_desktop: number;
  height_mobile: number;
  navigation: "dots" | "arrows" | "both";
};

export type ProductCarouselSettings = {
  title?: string;
  data: DataSource;
  auto_play: boolean;
  loop: boolean;
  show_price: boolean;
  show_discount: boolean;
  show_cart_btn: boolean;
};

export type ProductGridSettings = {
  data: DataSource;
  columns: number;
  gap: number;
  pagination: boolean;
  sort_options: boolean;
};

export type CategoryNavSettings = {
  categories: { id: number; icon?: MediaRef }[];
  type: "circle" | "square";
  text_style: Typography;
};

export type BrandSliderSettings = {
  brand_ids: number[];
  grayscale: boolean;
  speed: number;
};

export type CountdownSettings = {
  target_date: string;
  title: string;
  style: "flip" | "simple" | "blocks";
  link?: LinkValue;
};

export type BlogPostsSettings = {
  data: DataSource;
  layout: "grid" | "list";
  show_excerpt: boolean;
  show_meta: boolean;
};
