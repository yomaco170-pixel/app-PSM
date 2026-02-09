import Link from "next/link";
import { QrCode, ChevronRight } from "lucide-react";
import { commerces } from "@/data/mock";

const ScanPage = () => {
  return (
    <div className="space-y-6">
      <section className="card space-y-3">
        <h1 className="text-2xl font-semibold">Scanner</h1>
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <QrCode className="h-10 w-10 text-slate-400" />
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Scanner un QR code NEXO
            </p>
            <p className="text-xs text-slate-500">
              Activez votre caméra pour ouvrir un commerce.
            </p>
          </div>
          <button className="rounded-full bg-nexo-600 px-4 py-2 text-xs font-semibold text-white">
            Ouvrir la caméra
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-600">
          QR exemples
        </h2>
        {commerces.map((commerce) => (
          <Link
            key={commerce.slug}
            href={`/commerce/${commerce.slug}`}
            className="card flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {commerce.name}
              </p>
              <p className="text-xs text-slate-500">{commerce.category}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </Link>
        ))}
      </section>
    </div>
  );
};

export default ScanPage;
