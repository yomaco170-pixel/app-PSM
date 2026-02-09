export type ChatPreview = {
  id: string;
  name: string;
  type: "commerce" | "ami" | "groupe";
  lastMessage: string;
  lastTime: string;
  unread: number;
};

export type Message = {
  id: string;
  chatId: string;
  sender: string;
  text: string;
  time: string;
  fromMe: boolean;
};

export type Commerce = {
  slug: string;
  name: string;
  category: string;
  distance: string;
  rating: number;
  open: boolean;
  address: string;
  phone: string;
  chatId: string;
};

export type CommercePost = {
  id: string;
  commerceSlug: string;
  title: string;
  excerpt: string;
  tag: string;
  date: string;
};

export type Offer = {
  id: string;
  title: string;
  detail: string;
  progress: string;
  expires: string;
};

export const chats: ChatPreview[] = [
  {
    id: "1",
    name: "Boulangerie Lune",
    type: "commerce",
    lastMessage: "Votre commande est prête à 17h.",
    lastTime: "16:42",
    unread: 1
  },
  {
    id: "2",
    name: "Emma Richard",
    type: "ami",
    lastMessage: "On se retrouve à Commerce ?",
    lastTime: "15:18",
    unread: 0
  },
  {
    id: "3",
    name: "Groupe Vélo Nantes",
    type: "groupe",
    lastMessage: "Balade dimanche 10h au parc.",
    lastTime: "13:02",
    unread: 3
  },
  {
    id: "4",
    name: "Maison Sōma",
    type: "commerce",
    lastMessage: "Promo ramen à midi 🍜",
    lastTime: "11:55",
    unread: 0
  },
  {
    id: "5",
    name: "Papa",
    type: "ami",
    lastMessage: "Bien arrivé à Nantes !",
    lastTime: "09:12",
    unread: 0
  }
];

export const messages: Message[] = [
  {
    id: "m1",
    chatId: "1",
    sender: "Boulangerie Lune",
    text: "Bonjour ! On prépare vos 2 pains aux graines.",
    time: "16:20",
    fromMe: false
  },
  {
    id: "m2",
    chatId: "1",
    sender: "Moi",
    text: "Parfait, je passe vers 17h.",
    time: "16:21",
    fromMe: true
  },
  {
    id: "m3",
    chatId: "2",
    sender: "Emma",
    text: "Le coffee shop ouvre à 15h, on y va ?",
    time: "14:54",
    fromMe: false
  },
  {
    id: "m4",
    chatId: "2",
    sender: "Moi",
    text: "Oui ! On se retrouve place du Bouffay.",
    time: "15:02",
    fromMe: true
  },
  {
    id: "m5",
    chatId: "3",
    sender: "Loïc",
    text: "Qui a un casque en plus ?",
    time: "12:40",
    fromMe: false
  },
  {
    id: "m6",
    chatId: "4",
    sender: "Maison Sōma",
    text: "Menu du jour: ramen miso + mochi.",
    time: "11:50",
    fromMe: false
  }
];

export const commerces: Commerce[] = [
  {
    slug: "boulangerie-lune",
    name: "Boulangerie Lune",
    category: "Boulangerie",
    distance: "350 m",
    rating: 4.8,
    open: true,
    address: "12 rue de la Paix, Nantes",
    phone: "02 40 00 00 00",
    chatId: "1"
  },
  {
    slug: "maison-soma",
    name: "Maison Sōma",
    category: "Ramen & Izakaya",
    distance: "420 m",
    rating: 4.6,
    open: true,
    address: "5 quai des Antilles, Nantes",
    phone: "02 40 11 11 11",
    chatId: "4"
  },
  {
    slug: "atelier-velo-nantes",
    name: "Atelier Vélo Nantes",
    category: "Réparation vélo",
    distance: "600 m",
    rating: 4.7,
    open: false,
    address: "22 rue du Général Leclerc, Nantes",
    phone: "02 40 22 22 22",
    chatId: "3"
  }
];

export const commercePosts: CommercePost[] = [
  {
    id: "p1",
    commerceSlug: "boulangerie-lune",
    title: "Nouveau: brioche nantais",
    excerpt: "Disponible en précommande jusqu'à vendredi.",
    tag: "Nouveauté",
    date: "Aujourd'hui"
  },
  {
    id: "p2",
    commerceSlug: "maison-soma",
    title: "Happy hour ramen",
    excerpt: "-20% sur les bouillons miso entre 14h et 16h.",
    tag: "Promo",
    date: "Ce matin"
  },
  {
    id: "p3",
    commerceSlug: "atelier-velo-nantes",
    title: "Atelier express",
    excerpt: "Révision vélo complète en 24h.",
    tag: "Service",
    date: "Hier"
  }
];

export const offers: Offer[] = [
  {
    id: "o1",
    title: "Carte fidélité · Café de la Place",
    detail: "6/10 cafés collectés",
    progress: "Encore 4 cafés pour un offert.",
    expires: "Expire le 31/12"
  },
  {
    id: "o2",
    title: "Coupon · Maison Sōma",
    detail: "-15% sur le menu midi",
    progress: "Valable du lundi au jeudi.",
    expires: "Expire le 15/11"
  },
  {
    id: "o3",
    title: "Coupon · Atelier Vélo Nantes",
    detail: "Diagnostic gratuit",
    progress: "Un passage gratuit par mois.",
    expires: "Expire le 05/12"
  }
];

export const profile = {
  name: "Camille Dupont",
  status: "Toujours dispo pour découvrir des adresses locales.",
  neighborhood: "Île de Nantes",
  preferences: ["Restaurants", "Culture", "Mobilité douce", "Artisanat"]
};
