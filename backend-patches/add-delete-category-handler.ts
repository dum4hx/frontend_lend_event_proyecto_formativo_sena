import { Request, Response, NextFunction } from "express";

/**
 * DELETE /api/v1/materials/categories/:id
 * - Safe: reject if there are types in the category
 * - Force cascade: ?force=true deletes instances -> types -> category inside a transaction
 */
export function registerCategoryDeleteHandlers(materialRouter: any, deps: any) {
  const { MaterialModel, MaterialInstance, Category, AppError, organizationService, getOrgId, requirePermission } = deps;

  // Safe delete: reject when material types exist
  materialRouter.delete(
    "/categories/:id",
    requirePermission("materials:delete"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const categoryId = req.params.id as string;

        const typeCount = await MaterialModel.countDocuments({ categoryId });
        if (typeCount > 0) {
          return next(AppError.badRequest("Cannot delete category with existing material types", { typeCount }));
        }

        const category = await Category.findByIdAndDelete(categoryId);
        if (!category) return next(AppError.notFound("Category not found"));

        return res.json({ status: "success", message: "Category deleted successfully" });
      } catch (err) {
        return next(err);
      }
    },
  );

  // Force delete cascade (transactional)
  materialRouter.delete(
    "/categories/:id",
    requirePermission("materials:delete"),
    async (req: Request, res: Response, next: NextFunction) => {
      const categoryId = req.params.id as string;
      const force = String(req.query.force) === "true";

      if (!force) return next(); // let the previous handler handle non-forced deletes

      const session = await Category.startSession();
      try {
        await session.withTransaction(async () => {
          const types = await MaterialModel.find({ categoryId }).session(session).select("_id");
          const typeIds = types.map((t: any) => t._id);

          if (typeIds.length > 0) {
            // delete instances referencing types
            await MaterialInstance.deleteMany({ modelId: { $in: typeIds } }).session(session);

            // delete types
            await MaterialModel.deleteMany({ _id: { $in: typeIds } }).session(session);

            // adjust organization counters (best-effort inside transaction)
            await organizationService.decrementCatalogItemCount(getOrgId(req), typeIds.length);
          }

          const category = await Category.findOneAndDelete({ _id: categoryId }).session(session);
          if (!category) throw AppError.notFound("Category not found");
        });

        session.endSession();
        return res.json({ status: "success", message: "Category and dependents deleted" });
      } catch (err) {
        session.endSession();
        return next(err);
      }
    },
  );
}

/**
 * Usage: import and call `registerCategoryDeleteHandlers(materialRouter, { ...deps })`
 * where `deps` exposes the models and helpers (MaterialModel, MaterialInstance, Category,
 * AppError, organizationService, getOrgId, requirePermission).
 */
