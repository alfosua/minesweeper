import Link from 'next/link'

export default function Page() {
  return (
    <div className='flex flex-col gap-12 items-center mt-12'>
      <div className='flex flex-col gap-6 items-center'>
        <h2 className='text-3xl font-extrabold'>Mine Hunters</h2>
        <p className='text-xl font-bold'>Live Cooperative Minesweeper</p>
      </div>
      <div className='flex max-w-[600px] h-[250px] mx-auto'>
        <Link href='/g/3PzmhDw7yNWPeTQv72sV'>
          <div className='flex flex-col justify-between text-center bg-purple-600 text-white h-full py-12 px-4'>
            <p className='text-xl font-extrabold'>Join Game</p>
            <p className='text-base'>
              Join your team into an existing game, and start hunting right
              away.
            </p>
          </div>
        </Link>
        <Link href='/g/3PzmhDw7yNWPeTQv72sV'>
          <div className='flex flex-col justify-between text-center bg-cyan-400 text-white h-full py-12 px-4'>
            <p className='text-xl font-extrabold'>Start New Game</p>
            <p className='text-base'>
              Create your own challenge, setup a new world and invite your
              hunting mates.
            </p>
          </div>
        </Link>
        <Link href='/g/3PzmhDw7yNWPeTQv72sV'>
          <div className='flex flex-col justify-between text-center bg-orange-500 text-white h-full py-12 px-4'>
            <p className='text-xl font-extrabold'>Play Solo</p>
            <p className='text-base'>
              Train first with some solo adventures, and get ready for the next
              hunt.
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
