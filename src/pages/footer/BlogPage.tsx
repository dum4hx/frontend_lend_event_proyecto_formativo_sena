import FooterPageLayout from "./FooterPageLayout";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getFooterContentSummary } from "../../services/footerContentService";

export default function BlogPage() {
  const { data, isLoading, error } = useApiQuery(getFooterContentSummary, {
    context: "BlogPage",
  });

  const posts = (data?.highlightedFeatures ?? []).map((feature, index) => ({
    title: `Operational Insight ${index + 1}`,
    excerpt: `How teams are using ${feature.toLowerCase()} to improve delivery performance and customer trust.`,
  }));

  return (
    <FooterPageLayout
      title="Blog"
      subtitle="Insights, templates, and lessons learned from teams modernizing their event operations."
    >
      {isLoading && <p className="text-sm text-gray-400">Loading latest insights...</p>}
      {error && <p className="text-sm text-red-400">{error.message}</p>}

      <div className="space-y-4">
        {posts.map((post) => (
          <article key={post.title} className="card space-y-2">
            <h2 className="text-lg font-bold text-yellow-400">{post.title}</h2>
            <p className="text-gray-300">{post.excerpt}</p>
          </article>
        ))}
        {!isLoading && posts.length === 0 && (
          <article className="card">
            <p className="text-gray-300">No insights available right now. Check back soon for new updates.</p>
          </article>
        )}
      </div>
    </FooterPageLayout>
  );
}
