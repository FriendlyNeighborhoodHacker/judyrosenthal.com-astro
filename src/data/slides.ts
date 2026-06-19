export interface Slide {
  image: string;
  title: string;
  link: string;
  menuColor: 'black' | 'white';
  wideMode?: 'contain' | 'cover';
  sideColor?: string;
  shadowColor?: string;
}

export const slides: Slide[] = [
  {
    image: "images/homepage/judy_rosenthal_site_cover_photo.png",
    title: "Biography",
    link: "/biography/",
    menuColor: "white",
    wideMode: "contain",
    sideColor: "#76A7C0",
    shadowColor: "rgba(0, 0, 0, 0.75)"
  },
  {
    image: "images/homepage/02_The_Laura_full.jpg",
    title: "Art > Bicentennial Project",
    link: "/art/bicentennial-project/",
    menuColor: "white",
    wideMode: "contain",
    sideColor: "#488cb1"
  },
{
    image: "images/homepage/07_Pegasus_full.jpg",
    title: "Art",
    link: "/art",
    menuColor: "black",
    sideColor: "#e9e4d8"

},
  {
    image: "images/homepage/03_Courthouse Notecard_cropped.png",
    title: "Art > Houston",
    link: "/art/houston/",
    menuColor: "black",
    sideColor: "#e9e4d8"
  },
  {
    image: "images/homepage/04_brown_landscape_full.jpg",
    title: "Art > Cubistic Extensionism",
    link: "/art/cubistic-extensionism/",
    menuColor: "white",
    sideColor: "#6b5436"
  },

  {
    image: "images/homepage/05_Liberty.jpg",
    title: "Art > Heritage",
    link: "/art/heritage/",
    menuColor: "white",
    wideMode: "contain",
    sideColor: "#073a73"
  },
  {
    image: "images/homepage/06_The_Southwind_full.png",
    title: "Art > Seascapes",
    link: "/art/seascapes/",
    menuColor: "white",
    sideColor: "#3a5a6b"
  },
  {
    image: "images/homepage/06B_Picnic_full.jpg",
    title: "Art > Landscapes",
    link: "/art/landscapes/",
    menuColor: "black",
    sideColor: "#8a9a6b"
  },

  {
    image: "images/homepage/08_family_homepage.jpeg",
    title: "Family",
    link: "/family/",
    menuColor: "white",
    wideMode: "contain",
    sideColor: "#1a1208",
    shadowColor: "rgba(0,0,0,0.75)"
  }
];
