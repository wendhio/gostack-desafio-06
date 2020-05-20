import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Type invalid.', 400);
    }

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError("You don't have enough balance.", 400);
    }

    let categoryAux = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!categoryAux) {
      categoryAux = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(categoryAux);
    }

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category: categoryAux,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
