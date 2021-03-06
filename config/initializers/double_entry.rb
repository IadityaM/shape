require 'double_entry'

DoubleEntry.configure do |config|
  config.define_accounts do |accounts|
    user_scope = ->(user) do
      raise 'not a User' unless user.class.name == 'User'

      user.id
    end
    payment_scope = ->(payment) do
      raise 'not a Payment' unless payment.class.name == 'Payment'

      payment.id
    end
    # - We always debit cash when we receive revenue,
    #   and book the revenue in our revenue_deferred account
    # - We also book the Stripe transaction fee expense to our payment_processor account
    accounts.define(identifier: :cash, scope_identifier: payment_scope)

    # - For tests, cash moves into deferred revenue account because we can't immediately
    #   book the revenue for tests (we have to wait for payouts)
    # NOTE: allows negative, because we may actually pay out more people > sample_size
    accounts.define(identifier: :revenue_deferred, scope_identifier: payment_scope)

    # - Payment processor accounts track all of our expenses for transactions,
    #   e.g. Stripe and Paypal
    accounts.define(identifier: :payment_processor, scope_identifier: payment_scope, positive_only: true)

    # - When someone responds to a test or is owed payment,
    #   we credit their individual_owed account
    accounts.define(identifier: :individual_owed, scope_identifier: user_scope, positive_only: true)

    # - When pay someone out (via Paypal), we debit their owed account,
    #   and credit their individual_paid account
    # - We also book the Paypal transaction fee expense to the payment_processor account
    accounts.define(identifier: :individual_paid, scope_identifier: user_scope, positive_only: true)

    # - When a test has been paid out, we debit our revenue_deferred account,
    #   and move it into our revenue account
    # - After a certain period of time (TBD), we can move any unclaimed earnings from
    #   our revenue_deferred account to our revenue account
    accounts.define(identifier: :revenue, scope_identifier: payment_scope, positive_only: true)
  end

  config.define_transfers do |transfers|
    transfers.define(from: :cash, to: :revenue_deferred, code: :purchase)
    transfers.define(from: :cash, to: :payment_processor, code: :stripe_fee)
    transfers.define(from: :revenue_deferred, to: :payment_processor, code: :paypal_fee)
    transfers.define(from: :revenue_deferred, to: :individual_owed, code: :incentive_owed)
    transfers.define(from: :revenue_deferred, to: :revenue, code: :revenue)
    transfers.define(from: :revenue_deferred, to: :revenue, code: :unclaimed_incentive)
    transfers.define(from: :individual_owed, to: :individual_paid, code: :incentive_paid)
  end
end
