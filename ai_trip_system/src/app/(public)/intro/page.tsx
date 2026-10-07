"use client";

import { useEffect, useState } from "react";
import FeaturedTours from "@/components/home/FeaturedTours";
import HeroInspiration from "@/components/home/HeroSlide";
import HeroVideo from "@/components/home/HeroVideo";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import TourCTA from "@/components/home/TourCTA";
import FlashSale from "@/components/home/FlashSale";
import ComboPromotion from "@/components/home/ComboPromotion";
import NewCustomerPromo from "@/components/home/NewCustomerPromo";
import systemService, { SystemSettings } from "@/services/system/system.service";

export default function IntroPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    show_flash_sale: true,
    show_combo_promotion: false,
    show_new_customer_promo: true,
    show_featured_tours: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await systemService.getSettings();
      if (data) {
        setSettings(data);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="bg-gradient-to-r from-[#000080] to-[#00BFFF] min-h-screen relative">
      {/* Hero Video Section */}
      <HeroVideo />

      {/* Main Content */}
      <div id="main-content">
        <HeroInspiration />

        {/* FLASH SALE Section */}
        {settings.show_flash_sale && <FlashSale />}

        {settings.show_featured_tours && <FeaturedTours limit={6} />}

        {/* COMBO SAVING Section */}
        {settings.show_combo_promotion && <ComboPromotion />}

        {/* NEW CUSTOMER PROMO Section */}
        {settings.show_new_customer_promo && <NewCustomerPromo settings={settings} />}

        <WhyChooseUs />
        <TourCTA />
      </div>
    </div>
  );
}
