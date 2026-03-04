import { EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';

export default function Footer() {
    return (
        <footer className="bg-gray-950 text-gray-400">
            <div className="container-max py-16 grid md:grid-cols-3 gap-10">

                <div>
                    <h3 className="text-white text-xl font-bold">DocSign</h3>
                    <p className="mt-4">
                        Secure digital signatures with full audit trails and
                        tamper-proof documents.
                    </p>
                </div>

                <div>
                    <h4 className="text-white font-semibold mb-4">Product</h4>
                    <ul className="space-y-2">
                        <li>Upload & Sign</li>
                        <li>Document Tracking</li>
                        <li>Audit Logs</li>
                        <li>Secure Sharing</li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-semibold mb-4">Contact</h4>
                    <p className="flex items-center"><EnvelopeIcon className="h-5 mr-2" />razakhanahmad68@gmail.com</p>
                    <p className="flex items-center mt-2"><MapPinIcon className="h-5 mr-2" />Kolkata, India</p>
                </div>

            </div>

            <div className="text-center py-6 border-t border-gray-800 text-sm">
                © {new Date().getFullYear()} DocSign • Secure e-Signature Platform
            </div>
        </footer>
    );
}