import Image from 'next/image'

interface ClusterIconProps {
  icon: string | null | undefined
  name: string
  size?: number
  className?: string
}

export function ClusterIcon({ icon, name, size = 24, className }: ClusterIconProps) {
  if (!icon) return null

  return (
    <Image src={`/clusters/${icon}`} alt={name} width={size} height={size} className={className} />
  )
}
