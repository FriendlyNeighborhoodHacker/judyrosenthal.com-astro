export interface Crumb {
  /** Text shown for this breadcrumb segment. */
  label: string;
  /** If present, the segment is a link; otherwise it renders as plain text. */
  href?: string;
}

export interface Slide {
  /** Where clicking the slide navigates to. */
  link: string;
  /** Drives the header/menu text color (and which body class is applied). */
  menuColor: 'black' | 'white';
  /** Letterbox / side fill color behind contained images. */
  sideColor?: string;
  /** Glow color applied to the site title, nav, and breadcrumb overlay. */
  shadowColor?: string;

  /**
   * Title / breadcrumb content. Flexible trail:
   *   single title → [{ label: 'Biography' }]
   *   trail        → [{ label: 'Art', href: '/art' }, { label: 'Houston' }]
   */
  crumbs?: Crumb[];
  /** Simple label / a11y fallback. */
  title?: string;

  /**
   * Per-slide BOXED title style (the "homepage" look). When `titleBackground`
   * is set, the overlay renders against a solid box using these colors on
   * desktop/tablet. When omitted, the overlay is the text-only breadcrumb
   * (the "art" look) on desktop. On mobile (≤800px) the overlay is always a
   * full-width solid bar anchored to the bottom — using these colors if set,
   * otherwise derived from `menuColor`.
   */
  titleBackground?: string;
  titleColor?: string;

  /**
   * Text style for the title/breadcrumb overlay. Defaults to 'breadcrumb'
   * (the large Josefin Sans look from the art page). Use 'label' for the
   * smaller uppercase Helvetica look from the old homepage title.
   */
  titleStyle?: 'breadcrumb' | 'label';

  /* ---- Single-image mode (homepage) ---- */
  image?: string;
  wideMode?: 'contain' | 'cover';

  /* ---- Dual-image mode (art): responsive landscape/portrait swap ---- */
  landscape?: string;
  portrait?: string;
  collection?: string;
}

export const slides: Slide[] = [
  {
    image: "images/homepage/judy_rosenthal_site_cover_photo.png",
    title: "Biography",
    crumbs: [{ label: "Biography" }],
    link: "/biography/",
    menuColor: "white",
    wideMode: "contain",
    sideColor: "#000000",
    shadowColor: "rgba(0, 0, 0, 0.75)",
    titleBackground: "white",
    titleColor: "#222",
    titleStyle: "label"
  },
  {
    collection: "bicentennial",
    title: "Bicentennial Project",
    crumbs: [
      { label: "Home", href: "/" },
      { label: "Art", href: "/art/" },
      { label: "Bicentennial Project" }
    ],
    link: "/art/bicentennial-project/",
    landscape: "images/art/art_museum_gallery_homepage_images/art_bicentennial_landscape.png",
    portrait: "images/art/art_museum_gallery_homepage_images/art_bicentennial_portrait.png",
    menuColor: "white",
    shadowColor: "rgba(0,0,0,0.75)"
  },
  {
    collection: "houston",
    title: "Houston",
    crumbs: [
      { label: "Home", href: "/" },
      { label: "Art", href: "/art/" },
      { label: "Houston" }
    ],
    link: "/art/houston/",
    landscape: "images/art/art_museum_gallery_homepage_images/art_houston_landscape.png",
    portrait: "images/art/art_museum_gallery_homepage_images/art_houston_portrait.png",
    menuColor: "white",
    shadowColor: "rgba(0,0,0,0.75)"
  },
  {
    collection: "landscapes",
    title: "Landscapes",
    crumbs: [
      { label: "Home", href: "/" },
      { label: "Art", href: "/art/" },
      { label: "Landscapes" }
    ],
    link: "/art/landscapes/",
    landscape: "images/art/art_museum_gallery_homepage_images/art_landscapes_landscape.png",
    portrait: "images/art/art_museum_gallery_homepage_images/art_landscapes_portrait.png",
    menuColor: "white",
    shadowColor: "rgba(0,0,0,0.75)"
  },
  {
    collection: "patriotic",
    title: "Patriotic",
    crumbs: [
      { label: "Home", href: "/" },
      { label: "Art", href: "/art/" },
      { label: "Patriotic" }
    ],
    link: "/art/patriotic/",
    landscape: "images/art/art_museum_gallery_homepage_images/art_patriotic_landscape.png",
    portrait: "images/art/art_museum_gallery_homepage_images/art_patriotic_portrait.png",
    menuColor: "white",
    shadowColor: "rgba(0,0,0,0.75)"
  },
  {
    collection: "seascapes",
    title: "Seascapes",
    crumbs: [
      { label: "Home", href: "/" },
      { label: "Art", href: "/art/" },
      { label: "Seascapes" }
    ],
    link: "/art/seascapes/",
    landscape: "images/art/art_museum_gallery_homepage_images/art_seascapes_landscape.png",
    portrait: "images/art/art_museum_gallery_homepage_images/art_seascapes_portrait.png",
    menuColor: "white",
    shadowColor: "rgba(0,0,0,0.75)"
  },
  {
    collection: "cubistic_extensionism",
    title: "Cubistic Extensionism",
    crumbs: [
      { label: "Home", href: "/" },
      { label: "Art", href: "/art/" },
      { label: "Cubistic Extensionism" }
    ],
    link: "/art/cubisticextensionism/",
    landscape: "images/art/art_museum_gallery_homepage_images/art_cubistic_extensionism_landscape.png",
    portrait: "images/art/art_museum_gallery_homepage_images/art_cubistic_extensionism_portrait.png",
    menuColor: "white",
    shadowColor: "rgba(0,0,0,0.75)"
  }, 
  {
    image: "images/homepage/02_The_Laura_full.jpg",
    title: "Art > Bicentennial Project",
    crumbs: [{ label: "Art", href: "/art" }, { label: "Bicentennial Project" }],
    link: "/art/bicentennial-project/",
    menuColor: "white",
    wideMode: "contain",
    sideColor: "#488cb1",
    titleBackground: "white",
    titleColor: "#222",
    titleStyle: "label"
  },
  {
    image: "images/homepage/07_Pegasus_full.jpg",
    title: "Art",
    crumbs: [{ label: "Art" }],
    link: "/art",
    menuColor: "black",
    sideColor: "#F1F3EE",
    titleBackground: "black",
    titleColor: "white",
    titleStyle: "label"
  },
  {
    image: "images/homepage/03_Courthouse Notecard_cropped.png",
    title: "Art > Houston",
    crumbs: [{ label: "Art", href: "/art" }, { label: "Houston" }],
    link: "/art/houston/",
    menuColor: "white",
    sideColor: "#271F02",
    titleBackground: "white",
    titleColor: "#222",
    titleStyle: "label"
  },
  {
    image: "images/homepage/04_brown_landscape_full.jpg",
    title: "Art > Cubistic Extensionism",
    crumbs: [{ label: "Art", href: "/art" }, { label: "Cubistic Extensionism" }],
    link: "/art/cubistic-extensionism/",
    menuColor: "white",
    sideColor: "#6b5436",
    titleBackground: "white",
    titleColor: "#222",
    titleStyle: "label"
  },
  {
    image: "images/homepage/05_Liberty.jpg",
    title: "Art > Heritage",
    crumbs: [{ label: "Art", href: "/art" }, { label: "Heritage" }],
    link: "/art/heritage/",
    menuColor: "white",
    wideMode: "contain",
    sideColor: "#073a73",
    titleBackground: "white",
    titleColor: "#222",
    titleStyle: "label"
  },
  {
    image: "images/homepage/06_The_Southwind_full.png",
    title: "Art > Seascapes",
    crumbs: [{ label: "Art", href: "/art" }, { label: "Seascapes" }],
    link: "/art/seascapes/",
    menuColor: "white",
    sideColor: "#3D449C",
    titleBackground: "white",
    titleColor: "#222",
    titleStyle: "label"
  },
  {
    image: "images/homepage/06B_Picnic_full.jpg",
    title: "Art > Landscapes",
    crumbs: [{ label: "Art", href: "/art" }, { label: "Landscapes" }],
    link: "/art/landscapes/",
    menuColor: "black",
    sideColor: "#378994",
    titleBackground: "black",
    titleColor: "white",
    titleStyle: "label"
  },
  {
    image: "images/homepage/08_family_homepage.jpeg",
    title: "Family",
    crumbs: [{ label: "Family" }],
    link: "/family/",
    menuColor: "white",
    wideMode: "contain",
    sideColor: "#1a1208",
    shadowColor: "rgba(0,0,0,0.75)",
    titleBackground: "white",
    titleColor: "#222",
    titleStyle: "label"
  }
];
