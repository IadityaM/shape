require_relative 'boot'

require 'rails'
# Pick the frameworks you want:
require 'active_model/railtie'
require 'active_job/railtie'
require 'active_record/railtie'
require 'action_controller/railtie'
require 'action_mailer/railtie'
require 'action_view/railtie'
require 'action_cable/engine'
require 'sprockets/railtie'
require 'rails/test_unit/railtie'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Shape
  SUPPORT_EMAIL = 'hello@shape.space'.freeze
  ZENDESK_EMAIL = 'help@shape.space'.freeze
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 5.1

    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # ActionCable settings
    config.action_cable.url = ENV.fetch('ACTION_CABLE_URL') { 'ws://localhost:3000/cable' }

    # for serving gzipped assets
    config.middleware.use Rack::Deflater

    ::IDEO_PRODUCTS_GROUP_ID = 27
    ::FEEDBACK_INCENTIVE_AMOUNT = BigDecimal('2.00')
  end
end
