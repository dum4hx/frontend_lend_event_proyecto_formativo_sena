import FooterPageLayout from "./FooterPageLayout";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getFooterContentSummary } from "../../services/footerContentService";
import { useLanguage } from "../../contexts/useLanguage";

export default function BlogPage() {
  const { t } = useLanguage();
  const { data, isLoading, error } = useApiQuery(getFooterContentSummary, {
    context: "BlogPage",
  });

  const posts = (data?.highlightedFeatures ?? []).map((feature, index) => ({
    title: t("publicSite.blog.postTitle", { number: String(index + 1) }),
    excerpt: t("publicSite.blog.postExcerpt", { feature: feature.toLowerCase() }),
  }));

  return (
    <FooterPageLayout
      title={t("publicSite.blog.title")}
      subtitle={t("publicSite.blog.subtitle")}
    >
      {isLoading && <p className="text-sm text-gray-400">{t("publicSite.blog.loading")}</p>}
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
            <p className="text-gray-300">{t("publicSite.blog.empty")}</p>
          </article>
        )}
      </div>
    </FooterPageLayout>
  );
}
