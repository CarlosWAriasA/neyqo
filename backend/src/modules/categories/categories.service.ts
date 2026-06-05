import type { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { AuthError } from '../auth/auth.service';
import type { CreateCategoryInput, UpdateCategoryInput } from './categories.schemas';
import { defaultCategories } from './default-categories';

export interface CategoryResponse {
  id: string;
  name: string;
  type: Category['type'];
  icon: string;
  description?: string;
  isDefault: boolean;
  priority: number;
  status: Category['status'];
  createdAt: string;
  updatedAt: string;
}

export class CategoriesService {
  constructor(private readonly categoriesRepository: Repository<Category>) {}

  async list(userId: string): Promise<CategoryResponse[]> {
    const categories = await this.categoriesRepository.find({
      where: { userId },
      order: {
        type: 'ASC',
        status: 'ASC',
        priority: 'ASC',
        name: 'ASC',
      },
    });

    return categories.map((category) => this.toResponse(category));
  }

  async create(userId: string, payload: CreateCategoryInput): Promise<CategoryResponse> {
    const category = this.categoriesRepository.create({
      userId,
      name: payload.name,
      type: payload.type,
      icon: payload.icon,
      priority: payload.priority,
      description: payload.description || null,
      isDefault: false,
      status: 'active',
    });

    const savedCategory = await this.categoriesRepository.save(category);
    return this.toResponse(savedCategory);
  }

  async update(
    userId: string,
    categoryId: string,
    payload: UpdateCategoryInput,
  ): Promise<CategoryResponse> {
    const category = await this.findOwnedCategory(userId, categoryId);

    Object.assign(category, {
      ...payload,
      description: payload.description === undefined ? category.description : payload.description || null,
    });

    const savedCategory = await this.categoriesRepository.save(category);
    return this.toResponse(savedCategory);
  }

  async deactivate(userId: string, categoryId: string): Promise<CategoryResponse> {
    const category = await this.findOwnedCategory(userId, categoryId);
    category.status = 'inactive';

    const savedCategory = await this.categoriesRepository.save(category);
    return this.toResponse(savedCategory);
  }

  async reactivate(userId: string, categoryId: string): Promise<CategoryResponse> {
    const category = await this.findOwnedCategory(userId, categoryId);
    category.status = 'active';

    const savedCategory = await this.categoriesRepository.save(category);
    return this.toResponse(savedCategory);
  }

  async createInitialCategories(userId: string): Promise<void> {
    const existingDefaultCount = await this.categoriesRepository.count({
      where: {
        userId,
        isDefault: true,
      },
    });

    if (existingDefaultCount > 0) {
      return;
    }

    await this.categoriesRepository
      .createQueryBuilder()
      .insert()
      .into(Category)
      .values(
        defaultCategories.map((category) => ({
          ...category,
          userId,
          description: category.description ?? null,
          isDefault: true,
          status: 'active' as const,
        })),
      )
      .execute();
  }

  private async findOwnedCategory(userId: string, categoryId: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: {
        id: categoryId,
        userId,
      },
    });

    if (!category) {
      throw new AuthError(404, 'No encontramos esa categoría.');
    }

    return category;
  }

  private toResponse(category: Category): CategoryResponse {
    return {
      id: category.id,
      name: category.name,
      type: category.type,
      icon: category.icon,
      description: category.description ?? undefined,
      isDefault: category.isDefault,
      priority: category.priority,
      status: category.status,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }
}
