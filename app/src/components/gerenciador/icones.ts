/** Ícone de cada nó do FeatureManager (Épico 17) — lucide-react, sem custo. */
import {
  Anchor,
  ArrowDownToLine,
  CloudSun,
  Construction,
  Gauge,
  Link,
  MoveUpRight,
  RotateCw,
  Spline,
  Weight,
  type LucideIcon,
} from 'lucide-react'
import type { IdNo } from './nos'

export const ICONE_NO: Record<IdNo, LucideIcon> = {
  guindaste: Construction,
  lanca: MoveUpRight,
  giro: RotateCw,
  jib: Spline,
  sapatas: ArrowDownToLine,
  cabo: Anchor,
  carga: Weight,
  acessorios: Link,
  limites: Gauge,
  ambiente: CloudSun,
}
