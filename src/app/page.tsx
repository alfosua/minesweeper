import Image from 'next/image'
import { Inter } from 'next/font/google'
import Minesweeper from './Minesweeper'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <main>
      <Minesweeper />
    </main>
  )
}
