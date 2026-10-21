import { Breadcrumbs } from "./PageHero";

export function LegalBody({ title, body }: { title: string; body: string }) {
  return (
    <>
      <section className="bg-navy-dark py-14 text-white">
        <div className="container-x max-w-3xl">
          <Breadcrumbs items={[{ label: title }]} light />
          <h1 className="mt-5 font-heading text-[32px] font-extrabold sm:text-[40px]">{title}</h1>
        </div>
      </section>
      <section className="section">
        <div className="container-x max-w-3xl space-y-4 leading-relaxed text-ink/85">
          {body.split(/\n{2,}/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
        </div>
      </section>
    </>
  );
}
