import Game from '@/components/Game'
import { trpc } from '@/utilities/trpc'

type PageProps = {
  params: { id: string }
}

export default async function Page(props: PageProps) {
  const {
    params: { id },
  } = props

  const data = await trpc.map.getById.query(id)

  return (
    <main>
      <Game data={data} />
    </main>
  )
}
