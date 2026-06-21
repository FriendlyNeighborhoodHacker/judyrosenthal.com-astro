export interface MenuItem {
  name: string;
  url: string;
  children?: MenuItem[];
}

export const menu: MenuItem[] = [
  {
    name: "Biography",
    url: "/biography/",
    children: [
      { name: "Childhood", url: "/biography/childhood/" },
      { name: "Artist", url: "/biography/artist/" },
      { name: "Haskell", url: "/biography/haskell/" },
      { name: "Author", url: "/biography/author/" }
    ]
  },
  {
    name: "Art",
    url: "/art/",
    children: [
      { name: "Bicentennial Project", url: "/art/bicentennial-project/" },
      { name: "Houston", url: "/art/houston/" },
      { name: "Heritage", url: "/art/heritage/" },
      { name: "Cubistic Extensionism", url: "/art/cubistic-extensionism/" },
      { name: "Seascapes", url: "/art/seascapes/" },
      { name: "Landscapes", url: "/art/landscapes/" },
      { name: "Still Life and Flowers", url: "/art/still-life-and-flowers/" },
      { name: "Personal Art", url: "/art/personal-art/" },
      { name: "Animals", url: "/art/animals/" },
    ]
  },
  {
    name: "Recipes",
    url: "/recipes/"
  },
  {
    name: "Family",
    url: "/family/",
  }
];
