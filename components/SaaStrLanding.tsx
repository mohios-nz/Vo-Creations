import Image from "next/image";

interface Props {
  name: string;
  slug: string;
}

export default function SaaStrLanding({ name, slug }: Props) {
  return (
    <main className="min-h-screen bg-bg text-text flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-[radial-gradient(circle,rgba(245,166,35,0.05)_0%,transparent_60%)] pointer-events-none" />

      <div className="inline-flex items-center gap-2 bg-accent-dim border border-border-accent rounded-full px-4 py-1.5 text-[10px] font-semibold tracking-[1.5px] uppercase text-accent mb-6 relative z-10">
        SaaStr Annual 2026
      </div>

      <h1 className="text-[clamp(40px,9vw,72px)] font-extrabold leading-[1] tracking-tighter mb-10 text-center relative z-10">
        {name}
      </h1>

      <div className="bg-white p-5 rounded-2xl mb-10 relative z-10">
        <Image
          src={`/qr/${slug}.webp`}
          alt={`QR code to email ${name}`}
          width={220}
          height={220}
          priority
          unoptimized
        />
      </div>

      <a
        href="/"
        className="inline-flex items-center gap-2 bg-gradient-to-br from-accent to-[#E08A1E] text-bg font-bold text-base px-8 py-4 rounded-full hover:shadow-[0_0_40px_rgba(245,166,35,0.3)] hover:-translate-y-0.5 transition-all relative z-10"
      >
        Learn more about B2C2B UGC &rarr;
      </a>
    </main>
  );
}
