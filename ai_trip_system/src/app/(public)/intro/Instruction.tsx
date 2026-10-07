export default function Instruction() {
  return (
    <div id="contact" className="bg-transparent py-24 sm:py-26">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Hướng dẫn</h2>
        </div>

        {/* Video Container */}
        <div className="mx-auto mt-8 max-w-4xl">
          <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
            {/* YouTube Video Embed */}
            <iframe
              className="w-full h-full border-0"
              src="https://www.youtube.com/embed/ScMzIvxBSi4?si=dQw4w9WgXcQ"
              title="Hướng dẫn sử dụng Explavue - Lập lịch trình du lịch thông minh"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  )
}
