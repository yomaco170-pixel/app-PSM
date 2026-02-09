import Link from "next/link";
import { MapPin, Star, Phone, MessageCircle, BadgeInfo } from "lucide-react";
import { commerces, commercePosts } from "@/data/mock";

const CommercePage = ({ params }: { params: { slug: string } }) => {
  const commerce = commerces.find((item) => item.slug === params.slug);

  if (!commerce) {
    return (
      <div className="card space-y-2">
        <p className="text-sm text-slate-600">Commerce introuvable.</p>
        <Link href="/autour" className="text-sm font-semibold text-nexo-600">
          Retour aux commerces
        </Link>
      </div>
    );
  }

  const posts = commercePosts.filter(
    (post) => post.commerceSlug === commerce.slug
  );

  return (
    <div className="space-y-6">
      <section className="card space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-nexo-600">
            {commerce.category}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {commerce.name}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {commerce.address}
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="h-4 w-4 text-amber-400" />
            {commerce.rating}
          </span>
          <span className="inline-flex items-center gap-1">
            <Phone className="h-4 w-4" />
            {commerce.phone}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/chat/${commerce.chatId}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-nexo-600 py-2 text-sm font-semibold text-white"
          >
            <MessageCircle className="h-4 w-4" />
            Écrire sur NEXO
          </Link>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 py-2 text-sm font-medium text-slate-700">
            <BadgeInfo className="h-4 w-4" />
            Infos
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Posts</h2>
        {posts.map((post) => (
          <article key={post.id} className="card space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-1">
                {post.tag}
              </span>
              <span>{post.date}</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              {post.title}
            </h3>
            <p className="text-sm text-slate-600">{post.excerpt}</p>
          </article>
        ))}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">
          Produits & infos
        </h2>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>Horaires: 8h - 20h (lu-sa)</li>
          <li>Click & collect via NEXO</li>
          <li>Paiement sans contact disponible</li>
        </ul>
      </section>
    </div>
  );
};

export default CommercePage;
