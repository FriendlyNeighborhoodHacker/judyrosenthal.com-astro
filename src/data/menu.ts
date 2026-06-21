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
      { name: "Still Life and Flowers", url: "/art/still-life-and-flowers/" }
    ]
  },
  {
    name: "Recipes",
    url: "/recipes/",
    children: [
      { name: "Cream Sauce", url: "/recipes/cream-sauce/" },
      { name: "Cherry Cream Chicken", url: "/recipes/cherry-cream-chicken/" },
      { name: "Salmon", url: "/recipes/salmon/" },
      { name: "Asparagus", url: "/recipes/asparagus/" },
      { name: "Turkey Dressing", url: "/recipes/turkey-dressing/" },
      { name: "Cabbage Salad", url: "/recipes/cabbage-salad/" },
      { name: "Meringues", url: "/recipes/merangues/" },
      { name: "Hello Dollies", url: "/recipes/hello-dollies/" },
      { name: "Derby Pie", url: "/recipes/derby-pie/" }
    ]
  },
  {
    name: "Family",
    url: "/family/",
    children: [
      { name: "Brian Rosenthal", url: "/family/brian-rosenthal/" },
      { name: "Lilly Rosenthal", url: "/family/lilly-rosenthal/" },
      { name: "Charlie Rosenthal", url: "/family/charlie-rosenthal/" },
      { name: "Eve Rosenthal", url: "/family/eve-rosenthal/" },
      { name: "Lucy-Jane Watson", url: "/family/lucy-jane-watson/" },
      { name: "Julien David Saks", url: "/family/julien-david-saks/" }
    ]
  }
];
