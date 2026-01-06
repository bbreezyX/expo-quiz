import Image from "next/image";
import { JoinForm } from "@/components/home/join-form";


export default function HomePage() {

  return (
    <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 py-20">
      <div className="mx-auto w-full max-w-4xl space-y-24">
        {/* Hero Section */}
        <div className="text-center space-y-10">
          <div className="space-y-8">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40">
                <Image
                  src="/logo1.png"
                  alt="Expo Quiz Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-slate-900">
              Festival Quiz
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-500 max-w-2xl mx-auto font-light">
              Dinas Energi dan Sumber Daya Mineral Provinsi Jambi
            </p>
          </div>
        </div>

        {/* Join Form */}
        <JoinForm />

      </div>
    </main>
  );
}
