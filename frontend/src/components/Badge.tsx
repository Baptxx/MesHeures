interface Props {
  variant: 'complete' | 'partial' | 'empty' | 'tt' | 'conge_paye' | 'rtt' | 'maladie' | 'autre'
}

const config = {
  complete: {
    label: 'Complet',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
  },
  partial: {
    label: 'En cours',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
  },
  empty: {
    label: 'Non renseigné',
    className: 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
  },
  tt: {
    label: 'Télétravail',
    className: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-400 dark:border-teal-800',
  },
  conge_paye: {
    label: 'Congé payé',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
  },
  rtt: {
    label: 'RTT',
    className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800',
  },
  maladie: {
    label: 'Maladie',
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
  },
  autre: {
    label: 'Autre',
    className: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
  },
}

export function Badge({ variant }: Props) {
  const { label, className } = config[variant]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${className}`}>
      {label}
    </span>
  )
}
