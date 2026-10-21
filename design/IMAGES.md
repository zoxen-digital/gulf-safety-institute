# GISTRA theme images

Eleven standalone images were generated with the built-in image_gen tool and optimized to WebP.

- Hero, practical training, corporate CTA and About.
- Five category images shared by the 39 course detail pages.
- Al Khobar-inspired waterfront and Jubail-inspired industrial location illustrations.

Files: public/images/gistra/
Exact final prompts, dimensions and file sizes: design/image-prompts.json
URL map and compatibility mapping: lib/image-assets.ts

These are illustrative AI-generated marketing visuals, not photographs of actual GISTRA staff, offices or training sessions. The regional location images do not establish a real facility address.

Original default Unsplash images are resolved to bundled images in both public site data and SafeImage (including admin previews). Custom uploads and unrelated Unsplash URLs are retained. Fresh database seeds use the bundled paths. No database migration or reseed is needed to show the new images.

Admin uploads still use MongoDB /api/uploads URLs. The bundled theme assets are build-time files, not runtime disk uploads.
