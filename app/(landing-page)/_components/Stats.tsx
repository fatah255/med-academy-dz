const Stats = async () => {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="rounded-2xl border bg-card/60 p-8 sm:p-10">
          <dl className="grid grid-cols-1 gap-10 text-center sm:grid-cols-3">
            <div className="mx-auto flex max-w-xs flex-col gap-2">
              <dt className="text-sm text-muted-foreground">
                QCMs of previous years
              </dt>
              <dd className="order-first text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                +50 000
              </dd>
            </div>

            <div className="mx-auto flex max-w-xs flex-col gap-2">
              <dt className="text-sm text-muted-foreground">
                Explicative lessons
              </dt>
              <dd className="order-first text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                +80
              </dd>
            </div>

            <div className="mx-auto flex max-w-xs flex-col gap-2">
              <dt className="text-sm text-muted-foreground">
                Previous years exams
              </dt>
              <dd className="order-first text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                +1100
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
};

export default Stats;
