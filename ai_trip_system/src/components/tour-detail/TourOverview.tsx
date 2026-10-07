import { TourDetail } from "@/types/tour";
import { useTranslation } from "@/lib/i18n/hooks";

// components/tour-detail/TourOverview.tsx
export default function TourOverview({ tour }: { tour: TourDetail }) {
  const { t } = useTranslation("tour");
  
  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold mb-4">{t("overview.title")}</h2>
      <p className="text-gray-600 mb-6">{tour.tour.short_description}</p>
      <ul className="space-y-2">
        {(Array.isArray(tour.tour?.highlights) ? tour.tour.highlights : []).map((hl: string, i: number) => (
          <li key={i} className="flex items-center gap-2">✔ {hl}</li>
        ))}
      </ul>
    </section>
  );
}
