export default function Footer() {
  return (
    <footer className="bg-black text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12 text-sm">

        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">

          <div>
            <h6 className="font-bold mb-4 text-white">Support</h6>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">Contact</a></li>
              <li><a href="#" className="hover:text-white">Billing</a></li>
            </ul>
          </div>

          <div>
            <h6 className="font-bold mb-4 text-white">Company</h6>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-white">Business</a></li>
              <li><a href="#" className="hover:text-white">Pricing</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
            </ul>
          </div>

          <div>
            <h6 className="font-bold mb-4 text-white">Resources</h6>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">What's New</a></li>
              <li><a href="#" className="hover:text-white">Help Center</a></li>
            </ul>
          </div>

          <div className="col-span-2">
            <h6 className="font-bold mb-4 text-white">Location</h6>

            <div className="flex items-center gap-2 mb-6">
              <img
                src="https://flagcdn.com/w20/co.png"
                alt="Colombia"
                className="w-5 h-auto"
              />
              <span>Colombia</span>
            </div>

            <div className="flex gap-4 text-lg">
              <a href="#" className="hover:text-white"><i className="fab fa-instagram"></i></a>
              <a href="#" className="hover:text-white"><i className="fab fa-facebook"></i></a>
              <a href="#" className="hover:text-white"><i className="fab fa-youtube"></i></a>
              <a href="#" className="hover:text-white"><i className="fab fa-x-twitter"></i></a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-wrap gap-6 items-center text-xs text-gray-400">
          <span>© 2026 Lend-Event</span>
          <a href="#" className="hover:text-white">Terms of Service</a>
          <a href="#" className="hover:text-white">Cookie Policy</a>
        </div>

      </div>
    </footer>
  )
}
