import { Separator } from './ui/separator';

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-12">
      <div className="max-w-[1440px] mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-6">
          <div>
            <h5 className="mb-3">About</h5>
            <ul className="space-y-2 text-slate-600">
              <li><a href="#" className="hover:text-blue-600 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Press</a></li>
            </ul>
          </div>
          
          <div>
            <h5 className="mb-3">Support</h5>
            <ul className="space-y-2 text-slate-600">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h5 className="mb-3">Legal</h5>
            <ul className="space-y-2 text-slate-600">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h5 className="mb-3">Connect</h5>
            <ul className="space-y-2 text-slate-600">
              <li><a href="#" className="hover:text-blue-600 transition-colors">LinkedIn</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Instagram</a></li>
            </ul>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-slate-600">
          <p>© 2025 CareerPlay. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
