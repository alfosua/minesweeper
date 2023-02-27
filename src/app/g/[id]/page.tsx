import { db } from '@/utils/firebase'
import Game from '@/components/Game'
import { doc, getDoc } from 'firebase/firestore'
import { mapConverter } from '@/types/db'

type PageProps = {
  params: { id: string }
}

export default async function Page(props: PageProps) {
  const {
    params: { id },
  } = props

  const data = await getData(id)

  return (
    <main>
      <Game data={data} />
    </main>
  )
}

async function getData(id: string) {
  const snapshot = await getDoc(doc(db, 'maps', id).withConverter(mapConverter))
  const data = snapshot.data()
  if (!data) {
    throw new Error('Data not found')
  }
  return { ...data, id: snapshot.id, mineCount: 20 }
}
