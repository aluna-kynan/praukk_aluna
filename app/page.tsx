import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-gradient-brand text-white overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-3xl"></div>
      </div>
      
      <main className="z-10 flex flex-col items-center justify-center text-center p-8 max-w-3xl">
        <div className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2"></span>
          Sistem Peminjaman Alat Kini Lebih Mudah
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-sm">
          Pinjam Alat dengan <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-indigo-100">
            Cepat & Aman
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-blue-50 mb-10 max-w-2xl font-light">
          Aluna adalah platform sistem peminjaman alat yang dirancang untuk memudahkan manajemen peminjaman, pelacakan stok, dan pengembalian barang secara efisien dan transparan.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/login" className={buttonVariants({ size: "lg", className: "bg-white text-blue-600 hover:bg-blue-50 font-semibold rounded-full px-8 h-12" })}>
            Masuk Sekarang
          </Link>
          <Link href="#features" className={buttonVariants({ variant: "outline", size: "lg", className: "border-white/30 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full px-8 h-12 backdrop-blur-sm" })}>
            Pelajari Lebih Lanjut
          </Link>
        </div>
      </main>

      <footer className="absolute bottom-4 text-sm text-blue-100/70 z-10">
        &copy; {new Date().getFullYear()} Aluna System. Hak Cipta Dilindungi.
      </footer>
    </div>
  );
}
