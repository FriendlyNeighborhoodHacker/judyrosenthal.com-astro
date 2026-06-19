export interface ArtSlide {
  collection: string;
  title: string;
  link: string;
  landscape: string;
  portrait: string;
  menuColor: 'black' | 'white';
  sideColor?: string;
  shadowColor?: string;
}

export const artSlides: ArtSlide[] = [
  {
    collection: "bicentennial",
    title: "Bicentennial Project",
    link: "/art/bicentennial-project/",
    landscape: "images/art/art_bicentennial_landscape.png",
    portrait: "images/art/art_bicentennial_portrait.png",
    menuColor: "white",
    shadowColor: "rgba(0,0,0,0.75)"
  },
  {
    collection: "houston",
    title: "Houston",
    link: "/art/houston/",
    landscape: "images/art/art_houston_landscape.png",
    portrait: "images/art/art_houston_portrait.png",
    menuColor: "white",
    shadowColor: "rgba(0,0,0,0.75)"
  },
  {
    collection: "landscapes",
    title: "Landscapes",
    link: "/art/landscapes/",
    landscape: "images/art/art_landscapes_landscape.png",
    portrait: "images/art/art_landscapes_portrait.png",
    menuColor: "white",
    shadowColor: "rgba(0,0,0,0.75)"
  },
  {
    collection: "patriotic",
    title: "Patriotic",
    link: "/art/patriotic/",
    landscape: "images/art/art_patriotic_landscape.png",
    portrait: "images/art/art_patriotic_portrait.png",
    menuColor: "white",
    shadowColor: "rgba(0,0,0,0.75)"
  },
  {
    collection: "seascapes",
    title: "Seascapes",
    link: "/art/seascapes/",
    landscape: "images/art/art_seascapes_landscape.png",
    portrait: "images/art/art_seascapes_portrait.png",
    menuColor: "white",
    shadowColor: "rgba(0,0,0,0.75)"
  },
  {
    collection: "abstract_expressionism",
    title: "Abstract Expressionism",
    link: "/art/abstract-expressionism/",
    landscape: "images/art/art_abstract_expressionism_landscape.png",
    portrait: "images/art/art_abstract_expressionism_portrait.png",
    menuColor: "white",
    shadowColor: "rgba(0,0,0,0.75)"
  }
];
