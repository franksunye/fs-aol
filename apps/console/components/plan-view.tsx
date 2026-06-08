import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { SuggestionDoc } from "@/lib/suggestions";

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className="text-muted-foreground font-mono text-xs">
              {i + 1}
            </span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PlanView({
  s,
  title,
}: {
  s: SuggestionDoc;
  title?: string;
}) {
  const sit = s.情况判断 ?? {};
  const plan = s.跟进方案 ?? {};
  return (
    <div className="space-y-6">
      {title ? (
        <Badge variant="secondary" className="text-xs">
          {title}
        </Badge>
      ) : null}
      {s.原因摘要 ? (
        <p className="text-base leading-relaxed">{s.原因摘要}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="商机阶段" value={sit.商机阶段} />
        <Field label="报价状态" value={sit.报价状态} />
        <Field label="金额与方案" value={sit.金额与方案} />
        <Field label="渠道与部位" value={sit.渠道与部位} />
      </div>

      <Separator />

      {plan.主行动 ? (
        <div>
          <h3 className="mb-1 text-sm font-medium">主行动</h3>
          <p className="text-sm">{plan.主行动}</p>
        </div>
      ) : null}

      <ListBlock title="优先级依据" items={s.优先级依据} />
      <ListBlock title="沟通要点" items={plan.沟通要点} />
      <ListBlock title="避免事项" items={plan.避免事项} />
      <ListBlock title="引用查证" items={s.引用查证} />
    </div>
  );
}
